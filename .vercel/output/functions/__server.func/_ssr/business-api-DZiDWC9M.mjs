import { r as getSql } from "./db-CJpugj6O.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-C3f1xwne.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { $ as setStock, C as closeCampaign, D as createQuote, F as issueInvoice, G as recordFiling, H as prepareObligation, I as issueQuote, J as retireProcedure, K as recordRestricted, L as linkOrderMission, M as engage, N as fulfillOrder, P as invoiceOrder, Q as setStage, S as cancelOrder, V as openVenture, W as reclassifyObligation, X as setBurn, Y as runProcedure, Z as setCapitalStatus, _ as approveInstrument, a as addBrief, b as authorizeCampaign, d as addInstrument, et as setStructure, f as addMarketNote, g as allocatePayment, h as addQuoteLine, i as activateProcedure, it as waiveObligation, j as endEngagement, l as addFeedback, m as addProcedure, o as addCampaign, p as addPosition, r as acceptQuote, rt as voidInvoice, s as addCapital, tt as staffObligation, u as addFiling, w as createInvoice, x as authorizeLaunch } from "./venture-Apl_n6dM.mjs";
import { U as requireOwnerScope, o as assertCommandRate } from "./company-store-BXO2tnDW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/business-api-DZiDWC9M.js
function db(sql) {
	return sql;
}
function text(value, max = 4e3) {
	return typeof value === "string" ? value.slice(0, max) : "";
}
var businessCommand_createServerFn_handler = createServerRpc({
	id: "979f8a8981408844fba215888b7f1ff9e02f979e94c7fd9d0fa5daa5bfd67aa3",
	name: "businessCommand",
	filename: "src/lib/nexus/business-api.ts"
}, (opts) => businessCommand.__executeServer(opts));
var businessCommand = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.type !== "string" || !input.type) throw new Error("Unknown command");
	return {
		type: input.type,
		name: text(input.name, 200),
		idea: text(input.idea, 2e3),
		kind: text(input.kind, 40),
		note: text(input.note, 2e3),
		objective: text(input.objective, 4e3),
		amount: text(input.amount, 40),
		partyId: text(input.partyId, 80),
		offerId: text(input.offerId, 80),
		paymentId: text(input.paymentId, 80),
		recordId: text(input.recordId, 80),
		owner: text(input.owner, 120),
		trigger: text(input.trigger, 400),
		inputs: text(input.inputs, 1e3),
		actions: text(input.actions, 2e3),
		outputs: text(input.outputs, 1e3),
		exceptions: text(input.exceptions, 1e3),
		verification: text(input.verification, 1e3),
		jurisdiction: text(input.jurisdiction, 120),
		deadline: text(input.deadline, 40),
		department: text(input.department, 80),
		reportsTo: text(input.reportsTo, 80),
		quantity: text(input.quantity, 10),
		missionId: text(input.missionId, 80)
	};
}).middleware([authMiddleware]).handler(businessCommand_createServerFn_handler, async ({ context, data }) => {
	assertCommandRate(context.userId);
	const sql = db(await getSql());
	const base = {
		orgId: (await requireOwnerScope(sql, context.userId)).orgId,
		actorId: context.userId
	};
	if (data.type === "open") {
		await openVenture(sql, {
			...base,
			name: data.name,
			idea: data.idea,
			structure: data.kind
		});
		return { ok: true };
	}
	if (data.type === "stage") {
		await setStage(sql, {
			...base,
			stage: data.note
		});
		return { ok: true };
	}
	if (data.type === "structure") {
		await setStructure(sql, {
			...base,
			structure: data.kind
		});
		return { ok: true };
	}
	if (data.type === "burn") {
		await setBurn(sql, {
			...base,
			amount: data.amount
		});
		return { ok: true };
	}
	if (data.type === "authorize-launch") {
		await authorizeLaunch(sql, {
			...base,
			evidence: data.objective
		});
		return { ok: true };
	}
	if (data.type === "reclassify") {
		await reclassifyObligation(sql, {
			...base,
			obligationId: data.recordId,
			autonomy: data.kind
		});
		return { ok: true };
	}
	if (data.type === "prepare") {
		await prepareObligation(sql, {
			...base,
			obligationId: data.recordId,
			detail: data.objective
		});
		return { ok: true };
	}
	if (data.type === "staff") {
		await staffObligation(sql, {
			...base,
			obligationId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "record") {
		await recordRestricted(sql, {
			...base,
			obligationId: data.recordId,
			evidence: data.objective
		});
		return { ok: true };
	}
	if (data.type === "waive") {
		await waiveObligation(sql, {
			...base,
			obligationId: data.recordId,
			reason: data.objective
		});
		return { ok: true };
	}
	if (data.type === "filing") {
		await addFiling(sql, {
			...base,
			kind: data.kind,
			jurisdiction: data.jurisdiction,
			deadline: data.deadline,
			note: data.note
		});
		return { ok: true };
	}
	if (data.type === "record-filing") {
		await recordFiling(sql, {
			...base,
			filingId: data.recordId,
			note: data.objective
		});
		return { ok: true };
	}
	if (data.type === "instrument") {
		await addInstrument(sql, {
			...base,
			kind: data.kind,
			title: data.name,
			body: data.objective
		});
		return { ok: true };
	}
	if (data.type === "approve-instrument") {
		await approveInstrument(sql, {
			...base,
			instrumentId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "capital") {
		await addCapital(sql, {
			...base,
			kind: data.kind,
			name: data.name,
			amount: data.amount,
			fundingKind: data.note,
			note: data.objective
		});
		return { ok: true };
	}
	if (data.type === "capital-status") {
		await setCapitalStatus(sql, {
			...base,
			capitalId: data.recordId,
			status: data.kind
		});
		return { ok: true };
	}
	if (data.type === "invoice") {
		await createInvoice(sql, {
			...base,
			direction: data.kind,
			partyId: data.partyId,
			offerId: data.offerId,
			title: data.name,
			amount: data.amount
		});
		return { ok: true };
	}
	if (data.type === "issue-invoice") {
		await issueInvoice(sql, {
			...base,
			invoiceId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "void-invoice") {
		await voidInvoice(sql, {
			...base,
			invoiceId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "allocate") {
		await allocatePayment(sql, {
			...base,
			invoiceId: data.recordId,
			paymentId: data.paymentId,
			amount: data.amount
		});
		return { ok: true };
	}
	if (data.type === "brief") {
		await addBrief(sql, {
			...base,
			offerId: data.offerId,
			problem: data.name,
			requirements: data.objective,
			value: data.note,
			cost: data.amount
		});
		return { ok: true };
	}
	if (data.type === "feedback") {
		await addFeedback(sql, {
			...base,
			briefId: data.recordId,
			feedback: data.objective
		});
		return { ok: true };
	}
	if (data.type === "campaign") {
		await addCampaign(sql, {
			...base,
			name: data.name,
			segment: data.note,
			channel: data.kind,
			amount: data.amount,
			note: data.objective
		});
		return { ok: true };
	}
	if (data.type === "authorize-campaign") {
		await authorizeCampaign(sql, {
			...base,
			campaignId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "close-campaign") {
		await closeCampaign(sql, {
			...base,
			campaignId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "market-note") {
		await addMarketNote(sql, {
			...base,
			kind: data.kind,
			name: data.name,
			detail: data.objective
		});
		return { ok: true };
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
			verification: data.verification
		});
		return { ok: true };
	}
	if (data.type === "activate-procedure") {
		await activateProcedure(sql, {
			...base,
			procedureId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "run-procedure") {
		await runProcedure(sql, {
			...base,
			procedureId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "retire-procedure") {
		await retireProcedure(sql, {
			...base,
			procedureId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "position") {
		await addPosition(sql, {
			...base,
			title: data.name,
			kind: data.kind,
			department: data.department,
			reportsTo: data.reportsTo
		});
		return { ok: true };
	}
	if (data.type === "engage") {
		await engage(sql, {
			...base,
			positionId: data.recordId,
			partyId: data.partyId
		});
		return { ok: true };
	}
	if (data.type === "end-engagement") {
		await endEngagement(sql, {
			...base,
			engagementId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "stock") {
		await setStock(sql, {
			...base,
			offerId: data.offerId,
			onHand: data.amount,
			note: data.note
		});
		return { ok: true };
	}
	if (data.type === "quote") {
		await createQuote(sql, {
			...base,
			partyId: data.partyId,
			note: data.note
		});
		return { ok: true };
	}
	if (data.type === "quote-line") {
		await addQuoteLine(sql, {
			...base,
			quoteId: data.recordId,
			offerId: data.offerId,
			quantity: data.quantity,
			amount: data.amount
		});
		return { ok: true };
	}
	if (data.type === "issue-quote") {
		await issueQuote(sql, {
			...base,
			quoteId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "accept-quote") {
		await acceptQuote(sql, {
			...base,
			quoteId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "cancel-order") {
		await cancelOrder(sql, {
			...base,
			orderId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "fulfill-order") {
		await fulfillOrder(sql, {
			...base,
			orderId: data.recordId
		});
		return { ok: true };
	}
	if (data.type === "link-order") {
		await linkOrderMission(sql, {
			...base,
			orderId: data.recordId,
			missionId: data.missionId
		});
		return { ok: true };
	}
	if (data.type === "invoice-order") {
		await invoiceOrder(sql, {
			...base,
			orderId: data.recordId
		});
		return { ok: true };
	}
	throw new Error("Unknown command");
});
//#endregion
export { businessCommand_createServerFn_handler };
