import { o as __toESM } from "../_runtime.mjs";
import { l as OWNER_GATES, o as LEVEL_LABEL } from "./company-cyOhrTv5.mjs";
import { C as require_jsx_runtime, X as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useReadySession, t as Shell } from "./shell-B6Ot8wFZ.mjs";
import { a as when, n as Button, t as Alert } from "./nexus-ui-D8VU1C9e.mjs";
import { i as useCompany, r as errorText, t as companyCommand } from "./use-company-5WhiurfJ.mjs";
import { n as RunTokenNote } from "./company-notes-DJRl-QXj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/governance-BbYTMBvX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GovernancePage() {
	const { user, pending } = useReadySession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Checking session"
	}) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Record, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "py-8 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			className: "text-accent",
			children: "Sign in"
		}), " to read governance."]
	}) });
}
function Record() {
	const { data, error, loading, reload } = useCompany("governance");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formError, setFormError] = (0, import_react.useState)(null);
	if (loading && !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Loading the record"
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error ?? "Governance did not load." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-3 text-sm text-accent",
			onClick: reload,
			children: "Retry"
		})]
	});
	async function setPolicy(policy) {
		setBusy(true);
		setFormError(null);
		try {
			await companyCommand({ data: {
				type: "disclosure",
				policy
			} });
			reload();
		} catch (err) {
			setFormError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium",
				children: "Governance"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: "The owner is the only person who can authorize a plan or accept a delivery. An agent cannot widen its own permission."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Permission levels"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-2 text-sm",
					children: LEVEL_LABEL.map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "border-t border-line pt-2",
						children: label
					}, label))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Always the owner"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 list-disc space-y-1 pl-5 text-sm text-muted",
					children: OWNER_GATES.map((gate) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: gate }, gate))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Model disclosure"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: data.disclosure === "public" ? "Public is on. An authorized run of internal work may send the objective and the plan to the free model. Confidential work is not sent. The provider and model are written on the dispatch." : "Local only. Department writing stays in this workspace. Nothing is sent to a model provider."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Leased ",
							data.workers.leased,
							" · retry ",
							data.workers.retry,
							" · dead ",
							data.workers.dead,
							" · scheduler ",
							data.scheduler.status
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: busy || data.disclosure === "local",
							onClick: () => void setPolicy("local"),
							children: "Keep it local"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							disabled: busy || data.disclosure === "public",
							onClick: () => void setPolicy("public"),
							children: "Allow the free model"
						})]
					}),
					formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: formError })
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Run token"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 max-w-xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RunTokenNote, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: "The token is not a permission. It only decides which write is still current. A lost lease cannot save. Recording a Cash App payment does not let an agent spend."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Audit"
				}), data.events.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "No events yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-2",
					children: data.events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted",
								children: when(event.createdAt)
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: event.action
							}),
							event.toState ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [" → ", event.toState]
							}) : null,
							event.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block text-muted",
								children: event.detail
							}) : null,
							event.target?.startsWith("msn_") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/missions/$missionId",
								params: { missionId: event.target },
								className: "mt-0.5 block text-xs text-accent",
								children: "Open the mission"
							}) : null
						]
					}, event.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/blueprint",
					className: "text-accent",
					children: "Operating contract"
				})
			})
		]
	});
}
//#endregion
export { GovernancePage as component };
