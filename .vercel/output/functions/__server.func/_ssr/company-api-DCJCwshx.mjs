import { r as getSql } from "./db-CJpugj6O.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-C3f1xwne.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { B as loadBusiness } from "./venture-Apl_n6dM.mjs";
import { $ as setDependency, A as reactivateCompanyRole, B as rejectMission, C as linkMissionProject, D as payments, E as operations, F as recordPrice, G as retireCompanyOffer, H as requestExternalAction, I as recoverRun, J as runNext, K as revokeGithub, L as refreshGithub, M as recordExpenditure, N as recordObservation, O as planMission, P as recordPayment, Q as setDepartmentBudget, R as registerDevice, S as knowledge, T as missionView, U as requireOwnerScope, V as reopenMission, W as reserveFunds, X as setClassification, Y as setCapacity, Z as setCostPolicy, _ as deactivateCompanyRole, a as archiveCompanyParty, at as setScheduler, b as expireLeases, c as authorizeMission, ct as unlinkMissionTask, d as commandCenter, et as setDisclosure, f as commandDevice, g as createCompanyParty, h as createCompanyOffer, i as answerMission, it as setPriority, j as readGithubForDepartment, k as proposeSpecification, l as authorizeRevalidation, lt as voidPayment, m as connectGithub, n as acceptSpecification, nt as setMissionBudget, o as assertCommandRate, ot as setSpendingCeiling, q as rework, r as addCompanyContact, rt as setParent, s as assignCompanyRole, st as submitMission, t as acceptMission, tt as setMilestone, u as cancelMission, ut as workforce, v as editCompanyOffer, w as linkMissionTask, x as governance, y as editCompanyParty, z as registerIntegration } from "./company-store-BXO2tnDW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/company-api-DCJCwshx.js
async function claimTick(sql, orgId) {
	const rows = await sql`update scheduler_state
    set tick_lock_until = now() + interval '90 seconds', last_tick_at = now(), updated_at = now()
    where organization_id = ${orgId} and status = ${"running"}
      and (tick_lock_until is null or tick_lock_until <= now())
    returning organization_id`;
	return Boolean(rows[0]);
}
async function releaseTick(sql, orgId, error = "") {
	await sql`update scheduler_state
    set tick_lock_until = now(), last_error = ${error.slice(0, 500)}, updated_at = now()
    where organization_id = ${orgId}`;
}
async function eligibleMissionId(sql, orgId) {
	return (await sql`select m.id from missions m
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
    limit 1`)[0]?.id ?? null;
}
/**
* One tick. The owner chooses the operating state.
* running: this tick may drain a bounded outbox batch, then start at most one authorized assignment.
* paused or stopped: this function does not select the organization, so it does not drain or start work.
* A command or an open Operations page can still drain. Stopping the scheduler does not start a second worker.
*/
async function schedulerTick(sql, think) {
	await expireLeases(sql);
	const orgs = await sql`select organization_id from scheduler_state where status = ${"running"}`;
	let ran = 0;
	for (const org of orgs) {
		if (!await claimTick(sql, org.organization_id)) continue;
		try {
			const { drainOutbox, runNext, syncFindings } = await import("./company-store-BXO2tnDW.mjs").then((n) => n.p).then((n) => n.f);
			await drainOutbox(sql, org.organization_id, "svc:nexus");
			const missionId = await eligibleMissionId(sql, org.organization_id);
			if (missionId) {
				const owner = await sql`select owner_user_id from organizations where id = ${org.organization_id}`;
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
async function think(input) {
	const started = Date.now();
	try {
		const response = await fetch("https://text.pollinations.ai/openai", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(45e3),
			body: JSON.stringify({
				model: "openai-fast",
				max_tokens: 1400,
				temperature: .3,
				messages: [{
					role: "system",
					content: input.system
				}, {
					role: "user",
					content: input.user
				}]
			})
		});
		const durationMs = Date.now() - started;
		if (!response.ok) return {
			text: "",
			model: "",
			unavailable: true,
			outcome: "failed",
			durationMs,
			errorCategory: `http-${response.status}`
		};
		const text = (await response.json()).choices?.[0]?.message?.content ?? "";
		if (!text.trim()) return {
			text: "",
			model: "",
			unavailable: true,
			outcome: "failed",
			durationMs,
			errorCategory: "empty"
		};
		return {
			text,
			model: "openai-fast",
			outcome: "succeeded",
			durationMs
		};
	} catch (error) {
		const durationMs = Date.now() - started;
		const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
		return {
			text: "",
			model: "",
			unavailable: true,
			outcome: timeout ? "timeout" : "failed",
			durationMs,
			errorCategory: timeout ? "timeout" : "request"
		};
	}
}
function db(sql) {
	return sql;
}
var schedulerStarted = false;
function ensureScheduler() {
	if (schedulerStarted || process.env.NEXUS_SCHEDULER === "off") return;
	schedulerStarted = true;
	setInterval(() => {
		(async () => {
			try {
				await schedulerTick(db(await getSql()), think);
			} catch (error) {
				console.error("[scheduler]", error instanceof Error ? error.message : "tick failed");
			}
		})();
	}, 12e3).unref?.();
}
var loadCompany_createServerFn_handler = createServerRpc({
	id: "ef718009b73c0710b7dace9ddeefd4dac40f257fb45dca8fb490f8e8007f1321",
	name: "loadCompany",
	filename: "src/lib/nexus/company-api.ts"
}, (opts) => loadCompany.__executeServer(opts));
var loadCompany = createServerFn({ method: "POST" }).validator((input) => {
	const view = input?.view;
	if (view !== "command" && view !== "mission" && view !== "workforce" && view !== "operations" && view !== "knowledge" && view !== "governance" && view !== "payments" && view !== "business") throw new Error("Unknown view");
	return {
		view,
		missionId: typeof input.missionId === "string" ? input.missionId : ""
	};
}).middleware([authMiddleware]).handler(loadCompany_createServerFn_handler, async ({ context, data }) => {
	ensureScheduler();
	const sql = db(await getSql());
	if (data.view === "command") return commandCenter(sql, context.userId);
	if (data.view === "mission") return missionView(sql, context.userId, data.missionId);
	if (data.view === "workforce") return workforce(sql, context.userId);
	if (data.view === "operations") return operations(sql, context.userId);
	if (data.view === "knowledge") return knowledge(sql, context.userId);
	if (data.view === "payments") return payments(sql, context.userId);
	if (data.view === "business") return loadBusiness(sql, (await requireOwnerScope(sql, context.userId)).orgId);
	return governance(sql, context.userId);
});
var companyCommand_createServerFn_handler = createServerRpc({
	id: "a3fb3cded8e1b91bc0677cc9eeac309181dfd22beb7e6e0006104a1c72da5a0a",
	name: "companyCommand",
	filename: "src/lib/nexus/company-api.ts"
}, (opts) => companyCommand.__executeServer(opts));
var companyCommand = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.type !== "string" || !input.type) throw new Error("Unknown command");
	const text = (value) => typeof value === "string" ? value : "";
	return {
		type: input.type,
		missionId: text(input.missionId),
		objective: text(input.objective),
		note: text(input.note),
		payer: text(input.payer),
		amount: text(input.amount),
		paymentId: text(input.paymentId),
		policy: text(input.policy),
		dependsOn: text(input.dependsOn),
		scheduler: text(input.scheduler),
		classification: text(input.classification),
		parentId: text(input.parentId),
		priority: text(input.priority),
		department: text(input.department),
		secret: text(input.secret),
		partyId: text(input.partyId),
		offerId: text(input.offerId),
		role: text(input.role),
		kind: text(input.kind),
		label: text(input.label),
		value: text(input.value),
		name: text(input.name)
	};
}).middleware([authMiddleware]).handler(companyCommand_createServerFn_handler, async ({ context, data }) => {
	ensureScheduler();
	assertCommandRate(context.userId);
	const sql = db(await getSql());
	const thinker = think;
	const missionId = data.missionId ?? "";
	if (data.type === "submit") return submitMission(sql, context.userId, data.objective ?? "");
	if (data.type === "plan") {
		await planMission(sql, context.userId, missionId, thinker);
		return { ok: true };
	}
	if (data.type === "authorize") {
		await authorizeMission(sql, context.userId, missionId);
		return { ok: true };
	}
	if (data.type === "run") return runNext(sql, context.userId, missionId, thinker);
	if (data.type === "recover") {
		await recoverRun(sql, context.userId, missionId);
		return { ok: true };
	}
	if (data.type === "rework") return rework(sql, context.userId, missionId);
	if (data.type === "accept") {
		await acceptMission(sql, context.userId, missionId, data.note ?? "");
		return { ok: true };
	}
	if (data.type === "reject") {
		await rejectMission(sql, context.userId, missionId, data.note ?? "");
		return { ok: true };
	}
	if (data.type === "cancel") {
		await cancelMission(sql, context.userId, missionId);
		return { ok: true };
	}
	if (data.type === "reopen") {
		await reopenMission(sql, context.userId, missionId);
		return { ok: true };
	}
	if (data.type === "answer") {
		await answerMission(sql, context.userId, missionId, data.note);
		return { ok: true };
	}
	if (data.type === "record-payment") {
		await recordPayment(sql, context.userId, {
			payer: data.payer,
			amount: data.amount,
			note: data.note,
			missionId,
			department: data.department ?? ""
		});
		return { ok: true };
	}
	if (data.type === "record-expenditure") {
		await recordExpenditure(sql, context.userId, {
			payer: data.payer,
			amount: data.amount,
			note: data.note,
			missionId,
			department: data.department ?? ""
		});
		return { ok: true };
	}
	if (data.type === "create-party") {
		await createCompanyParty(sql, context.userId, {
			kind: data.kind ?? "",
			displayName: data.name ?? ""
		});
		return { ok: true };
	}
	if (data.type === "edit-party") {
		await editCompanyParty(sql, context.userId, {
			partyId: data.partyId ?? "",
			displayName: data.name ?? ""
		});
		return { ok: true };
	}
	if (data.type === "archive-party") {
		await archiveCompanyParty(sql, context.userId, data.partyId ?? "");
		return { ok: true };
	}
	if (data.type === "assign-role") {
		await assignCompanyRole(sql, context.userId, {
			partyId: data.partyId ?? "",
			role: data.role ?? ""
		});
		return { ok: true };
	}
	if (data.type === "deactivate-role") {
		await deactivateCompanyRole(sql, context.userId, {
			partyId: data.partyId ?? "",
			role: data.role ?? ""
		});
		return { ok: true };
	}
	if (data.type === "reactivate-role") {
		await reactivateCompanyRole(sql, context.userId, {
			partyId: data.partyId ?? "",
			role: data.role ?? ""
		});
		return { ok: true };
	}
	if (data.type === "add-contact") {
		await addCompanyContact(sql, context.userId, {
			partyId: data.partyId ?? "",
			label: data.label ?? "",
			value: data.value ?? ""
		});
		return { ok: true };
	}
	if (data.type === "create-offer") {
		await createCompanyOffer(sql, context.userId, {
			kind: data.kind ?? "",
			name: data.name ?? "",
			price: data.amount ?? ""
		});
		return { ok: true };
	}
	if (data.type === "edit-offer") {
		await editCompanyOffer(sql, context.userId, {
			offerId: data.offerId ?? "",
			name: data.name ?? "",
			price: data.amount ?? ""
		});
		return { ok: true };
	}
	if (data.type === "retire-offer") {
		await retireCompanyOffer(sql, context.userId, data.offerId ?? "");
		return { ok: true };
	}
	if (data.type === "void-payment") {
		await voidPayment(sql, context.userId, data.paymentId);
		return { ok: true };
	}
	if (data.type === "disclosure") {
		await setDisclosure(sql, context.userId, data.policy);
		return { ok: true };
	}
	if (data.type === "depend") {
		await setDependency(sql, context.userId, missionId, data.dependsOn);
		return { ok: true };
	}
	if (data.type === "scheduler") {
		await setScheduler(sql, context.userId, data.scheduler);
		return { ok: true };
	}
	if (data.type === "classification") {
		await setClassification(sql, context.userId, missionId, data.classification);
		return { ok: true };
	}
	if (data.type === "parent") {
		await setParent(sql, context.userId, missionId, data.parentId ?? "");
		return { ok: true };
	}
	if (data.type === "priority") {
		await setPriority(sql, context.userId, missionId, data.priority ?? "");
		return { ok: true };
	}
	if (data.type === "milestone") {
		await setMilestone(sql, context.userId, missionId, data.note ?? "");
		return { ok: true };
	}
	if (data.type === "capacity") {
		await setCapacity(sql, context.userId, data.priority ?? "");
		return { ok: true };
	}
	if (data.type === "ceiling") {
		await setSpendingCeiling(sql, context.userId, data.amount ?? "");
		return { ok: true };
	}
	if (data.type === "mission-budget") {
		await setMissionBudget(sql, context.userId, missionId, data.amount ?? "");
		return { ok: true };
	}
	if (data.type === "department-budget") {
		await setDepartmentBudget(sql, context.userId, data.note ?? "", data.amount ?? "");
		return { ok: true };
	}
	if (data.type === "reserve" || data.type === "estimate") {
		await reserveFunds(sql, context.userId, {
			amount: data.amount ?? "",
			note: data.note ?? "",
			missionId,
			kind: data.type === "estimate" ? "estimate" : "reserved"
		});
		return { ok: true };
	}
	if (data.type === "propose-spec") {
		await proposeSpecification(sql, context.userId, missionId, data.objective ?? "");
		return { ok: true };
	}
	if (data.type === "accept-spec") {
		await acceptSpecification(sql, context.userId, missionId);
		return { ok: true };
	}
	if (data.type === "revalidate") {
		await authorizeRevalidation(sql, context.userId, missionId);
		return { ok: true };
	}
	if (data.type === "cost-policy") {
		await setCostPolicy(sql, context.userId, data.note ?? "");
		return { ok: true };
	}
	if (data.type === "price") {
		const [provider, model] = (data.note ?? "").split("/");
		await recordPrice(sql, context.userId, {
			provider: provider ?? "",
			model: model ?? "",
			inputRate: data.amount ?? "",
			outputRate: data.objective ?? ""
		});
		return { ok: true };
	}
	if (data.type === "integration") {
		await registerIntegration(sql, context.userId, {
			name: data.note ?? "",
			category: data.policy ?? "",
			scopes: data.objective ?? ""
		});
		return { ok: true };
	}
	if (data.type === "external-action") {
		await requestExternalAction(sql, context.userId, {
			integrationId: data.note ?? "",
			operation: data.objective ?? "",
			actionClass: Number(data.priority ?? "1"),
			classification: data.classification ?? "internal"
		});
		return { ok: true };
	}
	if (data.type === "device") {
		await registerDevice(sql, context.userId, {
			name: data.note ?? "",
			permission: data.policy ?? ""
		});
		return { ok: true };
	}
	if (data.type === "device-command") {
		await commandDevice(sql, context.userId, data.note ?? "", data.objective ?? "");
		return { ok: true };
	}
	if (data.type === "observe") {
		await recordObservation(sql, context.userId, missionId, data.note ?? "", data.objective ?? "");
		return { ok: true };
	}
	if (data.type === "github-connect") {
		await connectGithub(sql, context.userId, data.secret ?? "", data.note ?? "");
		return { ok: true };
	}
	if (data.type === "github-revoke") {
		await revokeGithub(sql, context.userId, "revoked");
		return { ok: true };
	}
	if (data.type === "github-disconnect") {
		await revokeGithub(sql, context.userId, "disconnected");
		return { ok: true };
	}
	if (data.type === "github-refresh") {
		await refreshGithub(sql, context.userId);
		return { ok: true };
	}
	if (data.type === "github-read") {
		await readGithubForDepartment(sql, context.userId, {
			operation: data.objective ?? "",
			resource: data.note ?? "",
			department: data.department ?? "",
			missionId,
			page: data.priority ?? "1"
		});
		return { ok: true };
	}
	if (data.type === "link-project") {
		await linkMissionProject(sql, context.userId, missionId, data.note ?? "");
		return { ok: true };
	}
	if (data.type === "link-task") {
		await linkMissionTask(sql, context.userId, missionId, data.note ?? "");
		return { ok: true };
	}
	if (data.type === "unlink-task") {
		await unlinkMissionTask(sql, context.userId, missionId, data.note ?? "");
		return { ok: true };
	}
	throw new Error("Unknown command");
});
//#endregion
export { companyCommand_createServerFn_handler, loadCompany_createServerFn_handler };
