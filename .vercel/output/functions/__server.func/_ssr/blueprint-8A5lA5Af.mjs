import { c as MISSION_PATH, d as PIPELINE, f as RUN_TOKEN, l as OWNER_GATES, o as LEVEL_LABEL, s as MISSION_LABEL, u as PAYMENT } from "./company-cyOhrTv5.mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Shell } from "./shell-B6Ot8wFZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blueprint-8A5lA5Af.js
var import_jsx_runtime = require_jsx_runtime();
function BlueprintPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "max-w-2xl py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-muted",
				children: "Operating contract · 2.0"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 text-3xl font-medium",
				children: "What this company can do"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: "NEXUS is the owner’s command center for Atomic Dream Labs. A mission moves through a fixed workforce. Completion is a passing verification record plus your acceptance. An agent saying it is done does not count."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "The loop",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "list-decimal space-y-1 pl-5 text-sm",
					children: MISSION_PATH.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: MISSION_LABEL[step] }, step))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Workforce on this release",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs leading-relaxed text-muted",
					children: PIPELINE.join(" → ")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Research, product, architecture, design, and implementation are written when you run that department. Quality is computed from the artifacts. Operations assembles the packet and does not change the result."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Permission",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1 text-sm",
					children: LEVEL_LABEL.map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: label }, label))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 list-disc space-y-1 pl-5 text-sm text-muted",
					children: OWNER_GATES.map((gate) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: gate }, gate))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Run token",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-muted",
					children: RUN_TOKEN
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Payments",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-relaxed text-muted",
					children: [
						PAYMENT.business,
						" receives money on ",
						PAYMENT.method,
						" at ",
						PAYMENT.cashtag,
						". NEXUS shows that destination and stores a payment only when you record it. It does not charge a card, and it does not ask Cash App whether the money arrived."
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Honest limits",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "One workspace per signed-in owner." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Quality runs the implementation under OS limits: memory, CPU time, process count, file size, no network, and a private temp directory that is removed afterward. A throw, a missing control, a request for network or storage, or a missing limit fails the mission. A passing report is tied to that exact hash. Editing the implementation afterwards does not keep the pass." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A mission can wait on another mission. Execution will not start until that mission is accepted. A dependency that loops is refused." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Operations can run, pause, or stop the scheduler. While it is running, it starts the next authorized department and survives a restart. It does not authorize a plan, accept a packet, or change who owns the company. A lease older than 90 seconds cannot save." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Confidential missions stay in this workspace even if public disclosure is on. Internal missions may use the free model only when that disclosure is on. Each dispatch records the provider, the model, the classification, and the execution id." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "An answer you save is read by the next plan and by every department. It does not authorize execution." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A rejected packet can be rewritten, or the departments can be reset so the same plan runs again. Accepted work is not reopened." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A recorded payment can be voided. The row stays, the total drops it, and voiding is not a refund." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Rewriting a plan replaces that mission's unverified strategy. A verified decision stays." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Department writing uses GPT-OSS 20B only when Governance allows the public model. Local mode keeps the objective in this workspace. If the model is down or the rate limit is hit, the local orchestrator writes the step and says so." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Accepted missions become memory the next plan can read. A later acceptance of the same decision supersedes the older one. Proposed and contested notes are not treated as facts." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The company record stays when you come back. A published deploy uses the hosted database when one is configured." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A failed check is an open defect. Fix and retest redoes the department that owns it, then verifies again. A later pass closes the defect." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The old project and task boards are closed. They do not run work." })
					]
				})
			})
		]
	}) });
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2",
			children
		})]
	});
}
//#endregion
export { BlueprintPage as component };
