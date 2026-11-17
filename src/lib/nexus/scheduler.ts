import type { Thinker, Sql } from "./company-store";
import { expireLeases } from "./company-lease.ts";

export type SchedulerStatus = "running" | "paused" | "stopped";

export function isSchedulerStatus(value: string): value is SchedulerStatus {
  return value === "running" || value === "paused" || value === "stopped";
}

/** The scheduler may start work. It may not authorize, accept, or widen a permission. */
export function canSchedule(input: {
  scheduler: SchedulerStatus;
  missionStatus: string;
  assignmentStatus: string;
  parentAccepted: boolean;
  missionBusy: boolean;
  priorOpen: boolean;
}): boolean {
  if (input.scheduler !== "running") return false;
  if (input.missionStatus !== "AUTHORIZED" && input.missionStatus !== "EXECUTING") return false;
  if (input.assignmentStatus !== "READY") return false;
  if (!input.parentAccepted || input.missionBusy || input.priorOpen) return false;
  return true;
}

export async function claimTick(sql: Sql, orgId: string): Promise<boolean> {
  const rows = await sql<{ organization_id: string }>`update scheduler_state
    set tick_lock_until = now() + interval '90 seconds', last_tick_at = now(), updated_at = now()
    where organization_id = ${orgId} and status = ${"running"}
      and (tick_lock_until is null or tick_lock_until <= now())
    returning organization_id`;
  return Boolean(rows[0]);
}

export async function releaseTick(sql: Sql, orgId: string, error = ""): Promise<void> {
  await sql`update scheduler_state
    set tick_lock_until = now(), last_error = ${error.slice(0, 500)}, updated_at = now()
    where organization_id = ${orgId}`;
}

export async function eligibleMissionId(sql: Sql, orgId: string): Promise<string | null> {
  const rows = await sql<{ id: string }>`select m.id from missions m
    where m.organization_id = ${orgId}
      and m.status in ('AUTHORIZED', 'EXECUTING')
      and not exists (
        select 1 from assignments r where r.mission_id = m.id and r.status = ${"RUNNING"}
      )
      and (
        m.depends_on is null or exists (
          select 1 from missions parent
          where parent.id = m.depends_on and parent.organization_id = m.organization_id and parent.status = ${"ACCEPTED"}
        )
      )
      and exists (
        select 1 from assignments a
        where a.mission_id = m.id and a.status = ${"READY"}
          and not exists (
            select 1 from assignments earlier
            where earlier.mission_id = a.mission_id and earlier.position < a.position and earlier.status <> ${"DONE"}
          )
      )
      and (
        select count(*)::int from assignments running
        where running.organization_id = m.organization_id and running.status = ${"RUNNING"}
      ) < coalesce((select max_concurrent from portfolio_limits where organization_id = m.organization_id), 1)
      and not exists (
        select 1 from spec_impacts i
        where i.mission_id = m.id and i.revalidation in ('change_detected', 'impact_required', 'awaiting_owner')
      )
      and (
        m.budget_cents is null or (
          coalesce((select sum(amount_cents) from payments p where p.mission_id = m.id and p.voided_at is null and p.direction = 'expenditure'), 0)
          + coalesce((select sum(amount_cents) from commitments c where c.mission_id = m.id and c.status = ${"open"} and c.kind = ${"reserved"}), 0)
        ) < m.budget_cents
      )
      and (
        (select spending_ceiling_cents from portfolio_limits where organization_id = m.organization_id) is null
        or (
          coalesce((select sum(amount_cents) from payments p where p.organization_id = m.organization_id and p.voided_at is null and p.direction = 'expenditure'), 0)
          + coalesce((select sum(amount_cents) from commitments c where c.organization_id = m.organization_id and c.status = ${"open"} and c.kind = ${"reserved"}), 0)
        ) < (select spending_ceiling_cents from portfolio_limits where organization_id = m.organization_id)
      )
    order by m.priority desc, m.updated_at asc
    limit 1`;
  return rows[0]?.id ?? null;
}

/**
 * One tick. The owner chooses the operating state.
 * running: this tick may drain a bounded outbox batch, then start at most one authorized assignment.
 * paused or stopped: this function does not select the organization, so it does not drain or start work.
 * A command or an open Operations page can still drain. Stopping the scheduler does not start a second worker.
 */
export async function schedulerTick(sql: Sql, think: Thinker): Promise<{ ran: number }> {
  await expireLeases(sql);
  const orgs = await sql<{ organization_id: string }>`select organization_id from scheduler_state where status = ${"running"}`;
  let ran = 0;
  for (const org of orgs) {
    const claimed = await claimTick(sql, org.organization_id);
    if (!claimed) continue;
    try {
      const { drainOutbox, runNext, syncFindings } = await import("./company-store.ts");
      await drainOutbox(sql, org.organization_id, "svc:nexus");
      const missionId = await eligibleMissionId(sql, org.organization_id);
      if (missionId) {
        const owner = await sql<{ owner_user_id: string }>`select owner_user_id from organizations where id = ${org.organization_id}`;
        if (owner[0]?.owner_user_id) {
          await runNext(sql, owner[0].owner_user_id, missionId, think);
          ran += 1;
        }
      }
      await releaseTick(sql, org.organization_id);
      await syncFindings(sql, org.organization_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The scheduler tick failed.";
      await releaseTick(sql, org.organization_id, message);
    }
  }
  return { ran };
}
