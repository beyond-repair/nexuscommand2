import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { assertCommandRate } from "./command-rate";
import { requireOwnerScope, type Sql } from "./company-store";
import {
  activateProcedure,
  addBrief,
  addCampaign,
  addCapital,
  addFeedback,
  addFiling,
  addInstrument,
  addMarketNote,
  addPosition,
  addProcedure,
  allocatePayment,
  approveInstrument,
  authorizeCampaign,
  authorizeLaunch,
  closeCampaign,
  createInvoice,
  endEngagement,
  engage,
  issueInvoice,
  openVenture,
  prepareObligation,
  recordFiling,
  recordRestricted,
  reclassifyObligation,
  retireProcedure,
  runProcedure,
  setBurn,
  setCapitalStatus,
  setStage,
  setStock,
  setStructure,
  staffObligation,
  voidInvoice,
  waiveObligation,
  createQuote,
  addQuoteLine,
  issueQuote,
  acceptQuote,
  cancelOrder,
  fulfillOrder,
  linkOrderMission,
  invoiceOrder,
} from "./venture";

function db(sql: unknown): Sql {
  return sql as Sql;
}

function text(value: unknown, max = 4000): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export const businessCommand = createServerFn({ method: "POST" })
  .validator((input: Record<string, unknown> | null) => {
    if (!input || typeof input.type !== "string" || !input.type) throw new Error("Unknown command");
    return {
      type: input.type,
      name: text(input.name, 200),
      idea: text(input.idea, 2000),
      kind: text(input.kind, 40),
      note: text(input.note, 2000),
      objective: text(input.objective, 4000),
      amount: text(input.amount, 40),
      partyId: text(input.partyId, 80),
      offerId: text(input.offerId, 80),
      paymentId: text(input.paymentId, 80),
      recordId: text(input.recordId, 80),
      owner: text(input.owner, 120),
      trigger: text(input.trigger, 400),
      inputs: text(input.inputs, 1000),
      actions: text(input.actions, 2000),
      outputs: text(input.outputs, 1000),
      exceptions: text(input.exceptions, 1000),
      verification: text(input.verification, 1000),
      jurisdiction: text(input.jurisdiction, 120),
      deadline: text(input.deadline, 40),
      department: text(input.department, 80),
      reportsTo: text(input.reportsTo, 80),
      quantity: text(input.quantity, 10),
      missionId: text(input.missionId, 80),
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    assertCommandRate(context.userId);
    const sql = db(await getSql());
    const scope = await requireOwnerScope(sql, context.userId);
    const base = { orgId: scope.orgId, actorId: context.userId };
    if (data.type === "open") {
      await openVenture(sql, { ...base, name: data.name, idea: data.idea, structure: data.kind });
      return { ok: true as const };
    }
    if (data.type === "stage") {
      await setStage(sql, { ...base, stage: data.note });
      return { ok: true as const };
    }
    if (data.type === "structure") {
      await setStructure(sql, { ...base, structure: data.kind });
      return { ok: true as const };
    }
    if (data.type === "burn") {
      await setBurn(sql, { ...base, amount: data.amount });
      return { ok: true as const };
    }
    if (data.type === "authorize-launch") {
      await authorizeLaunch(sql, { ...base, evidence: data.objective });
      return { ok: true as const };
    }
    if (data.type === "reclassify") {
      await reclassifyObligation(sql, { ...base, obligationId: data.recordId, autonomy: data.kind });
      return { ok: true as const };
    }
    if (data.type === "prepare") {
      await prepareObligation(sql, { ...base, obligationId: data.recordId, detail: data.objective });
      return { ok: true as const };
    }
    if (data.type === "staff") {
      await staffObligation(sql, { ...base, obligationId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "record") {
      await recordRestricted(sql, { ...base, obligationId: data.recordId, evidence: data.objective });
      return { ok: true as const };
    }
    if (data.type === "waive") {
      await waiveObligation(sql, { ...base, obligationId: data.recordId, reason: data.objective });
      return { ok: true as const };
    }
    if (data.type === "filing") {
      await addFiling(sql, { ...base, kind: data.kind, jurisdiction: data.jurisdiction, deadline: data.deadline, note: data.note });
      return { ok: true as const };
    }
    if (data.type === "record-filing") {
      await recordFiling(sql, { ...base, filingId: data.recordId, note: data.objective });
      return { ok: true as const };
    }
    if (data.type === "instrument") {
      await addInstrument(sql, { ...base, kind: data.kind, title: data.name, body: data.objective });
      return { ok: true as const };
    }
    if (data.type === "approve-instrument") {
      await approveInstrument(sql, { ...base, instrumentId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "capital") {
      await addCapital(sql, { ...base, kind: data.kind, name: data.name, amount: data.amount, fundingKind: data.note, note: data.objective });
      return { ok: true as const };
    }
    if (data.type === "capital-status") {
      await setCapitalStatus(sql, { ...base, capitalId: data.recordId, status: data.kind });
      return { ok: true as const };
    }
    if (data.type === "invoice") {
      await createInvoice(sql, { ...base, direction: data.kind, partyId: data.partyId, offerId: data.offerId, title: data.name, amount: data.amount });
      return { ok: true as const };
    }
    if (data.type === "issue-invoice") {
      await issueInvoice(sql, { ...base, invoiceId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "void-invoice") {
      await voidInvoice(sql, { ...base, invoiceId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "allocate") {
      await allocatePayment(sql, { ...base, invoiceId: data.recordId, paymentId: data.paymentId, amount: data.amount });
      return { ok: true as const };
    }
    if (data.type === "brief") {
      await addBrief(sql, { ...base, offerId: data.offerId, problem: data.name, requirements: data.objective, value: data.note, cost: data.amount });
      return { ok: true as const };
    }
    if (data.type === "feedback") {
      await addFeedback(sql, { ...base, briefId: data.recordId, feedback: data.objective });
      return { ok: true as const };
    }
    if (data.type === "campaign") {
      await addCampaign(sql, { ...base, name: data.name, segment: data.note, channel: data.kind, amount: data.amount, note: data.objective });
      return { ok: true as const };
    }
    if (data.type === "authorize-campaign") {
      await authorizeCampaign(sql, { ...base, campaignId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "close-campaign") {
      await closeCampaign(sql, { ...base, campaignId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "market-note") {
      await addMarketNote(sql, { ...base, kind: data.kind, name: data.name, detail: data.objective });
      return { ok: true as const };
    }
    if (data.type === "procedure") {
      await addProcedure(sql, {
        ...base,
        name: data.name,
        owner: data.owner,
        trigger: data.trigger,
        inputs: data.inputs,
        actions: data.actions,
        outputs: data.outputs,
        exceptions: data.exceptions,
        verification: data.verification,
      });
      return { ok: true as const };
    }
    if (data.type === "activate-procedure") {
      await activateProcedure(sql, { ...base, procedureId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "run-procedure") {
      await runProcedure(sql, { ...base, procedureId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "retire-procedure") {
      await retireProcedure(sql, { ...base, procedureId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "position") {
      await addPosition(sql, { ...base, title: data.name, kind: data.kind, department: data.department, reportsTo: data.reportsTo });
      return { ok: true as const };
    }
    if (data.type === "engage") {
      await engage(sql, { ...base, positionId: data.recordId, partyId: data.partyId });
      return { ok: true as const };
    }
    if (data.type === "end-engagement") {
      await endEngagement(sql, { ...base, engagementId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "stock") {
      await setStock(sql, { ...base, offerId: data.offerId, onHand: data.amount, note: data.note });
      return { ok: true as const };
    }
    if (data.type === "quote") {
      await createQuote(sql, { ...base, partyId: data.partyId, note: data.note });
      return { ok: true as const };
    }
    if (data.type === "quote-line") {
      await addQuoteLine(sql, { ...base, quoteId: data.recordId, offerId: data.offerId, quantity: data.quantity, amount: data.amount });
      return { ok: true as const };
    }
    if (data.type === "issue-quote") {
      await issueQuote(sql, { ...base, quoteId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "accept-quote") {
      await acceptQuote(sql, { ...base, quoteId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "cancel-order") {
      await cancelOrder(sql, { ...base, orderId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "fulfill-order") {
      await fulfillOrder(sql, { ...base, orderId: data.recordId });
      return { ok: true as const };
    }
    if (data.type === "link-order") {
      await linkOrderMission(sql, { ...base, orderId: data.recordId, missionId: data.missionId });
      return { ok: true as const };
    }
    if (data.type === "invoice-order") {
      await invoiceOrder(sql, { ...base, orderId: data.recordId });
      return { ok: true as const };
    }
    throw new Error("Unknown command");
  });
