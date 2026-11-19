import { o as __toESM } from "../_runtime.mjs";
import { n as ASSIGNMENT_LABEL } from "./company-cyOhrTv5.mjs";
import { C as require_jsx_runtime, X as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useReadySession, t as Shell } from "./shell-B6Ot8wFZ.mjs";
import { a as when, n as Button, t as Alert } from "./nexus-ui-D8VU1C9e.mjs";
import { i as useCompany, r as errorText, t as companyCommand } from "./use-company-5WhiurfJ.mjs";
import { t as PayCard } from "./company-notes-DJRl-QXj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/operations-ByXccwbG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OperationsPage() {
	const { user, pending } = useReadySession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Checking session"
	}) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Board, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "py-8 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			className: "text-accent",
			children: "Sign in"
		}), " to see operations."]
	}) });
}
function Board() {
	const { data, error, loading, reload } = useCompany("operations");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formError, setFormError] = (0, import_react.useState)(null);
	if (loading && !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Loading operations"
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error ?? "Operations did not load." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-3 text-sm text-accent",
			onClick: reload,
			children: "Retry"
		})]
	});
	async function setScheduler(status) {
		setBusy(true);
		setFormError(null);
		try {
			await companyCommand({ data: {
				type: "scheduler",
				scheduler: status
			} });
			reload();
		} catch (err) {
			setFormError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	async function setCapacity(value) {
		setBusy(true);
		setFormError(null);
		try {
			await companyCommand({ data: {
				type: "capacity",
				priority: value
			} });
			reload();
		} catch (err) {
			setFormError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	const scheduler = data.scheduler;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium",
				children: "Operations"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: scheduler.status === "running" ? "The scheduler is operating. It starts the next authorized department and stops there. It cannot authorize a plan or accept a packet." : scheduler.status === "paused" ? "The scheduler is paused. Nothing new starts until you resume it. A run already in flight can still finish." : "The scheduler is stopped. Authorized work waits until you start it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					"Queue ",
					scheduler.queue,
					" · capacity ",
					data.capacity,
					" · leased ",
					data.workers.leased,
					" · retry ",
					data.workers.retry,
					" · dead ",
					data.workers.dead,
					scheduler.lastTick ? ` · last tick ${when(scheduler.lastTick)}` : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Delivery queue"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Pending ",
							data.outbox.pending,
							". Processing ",
							data.outbox.processing,
							". Waiting to retry ",
							data.outbox.failed,
							". Dead ",
							data.outbox.dead,
							". Completed ",
							data.outbox.completed,
							".",
							data.outbox.oldestSeconds == null ? " No event is waiting." : ` Oldest waiting event is ${data.outbox.oldestSeconds} seconds.`,
							" ",
							"A queued event is not a finished operation, and delivering it does not authorize or accept anything.",
							" ",
							"The scheduler drains this queue only while it is running. Paused and stopped do not. Opening this page still does."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"This process is tracking ",
							data.rateLimit.tracked,
							" command-rate ",
							data.rateLimit.tracked === 1 ? "entry" : "entries",
							". Idle entries dropped: ",
							data.rateLimit.dropped,
							". Limit ",
							data.rateLimit.limit,
							" commands per ",
							Math.round(data.rateLimit.windowMs / 1e3),
							" seconds. This is one process, not a cluster-wide limit."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Measured operations"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3",
					children: data.metrics.map((metric) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-line pt-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: metric.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-muted",
							children: metric.kind === "unavailable" || metric.value == null ? metric.note : `${metric.value} ${metric.unit}, from ${metric.sample} observation${metric.sample === 1 ? "" : "s"}. ${metric.note}`
						})]
					}, metric.name))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Recommendations"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: data.recommendations.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted",
						children: note
					}, note))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Maintenance"
				}), data.maintenance.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "No maintenance condition is currently proposed. An empty list is not a health score."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3",
					children: data.maintenance.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-line pt-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.title }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-muted",
								children: item.evidence
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-xs text-muted",
								children: [
									item.status,
									" · ",
									item.risk,
									" risk · ",
									item.autonomous ? "may run without a new approval" : "owner",
									" · ",
									item.result
								]
							})
						]
					}, item.id))
				})]
			}),
			scheduler.lastError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-danger",
				children: scheduler.lastError
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: busy || scheduler.status === "running",
						onClick: () => void setScheduler("running"),
						children: "Operate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						disabled: busy || scheduler.status === "paused",
						onClick: () => void setScheduler("paused"),
						children: "Pause"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						disabled: busy || scheduler.status === "stopped",
						onClick: () => void setScheduler("stopped"),
						children: "Stop"
					})
				]
			}),
			formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: formError })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 max-w-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Concurrent departments"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "The owner sets how many departments may run at once. The default is one. This does not raise a budget."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: String(data.capacity),
						disabled: busy,
						onChange: (event) => void setCapacity(event.target.value),
						className: "mt-3 h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
						children: [
							1,
							2,
							3,
							4
						].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value,
							children: value
						}, value))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Leases"
				}), data.leases.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "No lease is active. An expired lease is released on the next tick and cannot save."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-1",
					children: data.leases.map((lease) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-sm text-muted",
						children: [
							lease.agentName,
							" · ",
							lease.missionTitle,
							" · until ",
							when(lease.until)
						]
					}, `${lease.missionId}:${lease.agentName}`))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Last sandbox"
				}), data.sandbox ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [
						data.sandbox.policy || data.sandbox.suite || "unrecorded",
						data.sandbox.filesystem ? ` · root ${data.sandbox.filesystem}` : "",
						data.sandbox.identity ? ` · ${data.sandbox.identity}` : "",
						data.sandbox.capabilities ? ` · capabilities ${data.sandbox.capabilities}` : "",
						data.sandbox.seccomp ? ` · ${data.sandbox.seccomp}` : "",
						data.sandbox.network ? ` · network ${data.sandbox.network}` : "",
						data.sandbox.proc ? ` · proc ${data.sandbox.proc}` : "",
						data.sandbox.env ? ` · env ${data.sandbox.env}` : "",
						" · ",
						Math.round(data.sandbox.memoryBytes / 1048576) || "?",
						" MB · ",
						data.sandbox.cpuSeconds,
						"s cpu · ",
						data.sandbox.processes,
						" processes · ",
						data.sandbox.fileBytes,
						" byte disk",
						" · ",
						data.sandbox.enforced ? "boundary applied" : "boundary was not applied"
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "No quality report has been stored yet."
				})]
			}),
			data.recoveries.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-1",
				children: data.recoveries.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "text-sm text-muted",
					children: [
						when(row.createdAt),
						" · ",
						row.detail
					]
				}, row.id))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 max-w-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayCard, {})
			}),
			data.rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "No assignments yet. Establish a mission and develop its strategy."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 divide-y divide-line border-y border-line",
				children: data.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/missions/$missionId",
					params: { missionId: row.missionId },
					className: "flex min-h-11 items-center justify-between gap-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block truncate text-sm",
							children: [
								row.agentName,
								" · ",
								row.title
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-xs text-muted",
							children: row.missionTitle
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "shrink-0 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `block font-mono text-xs ${row.status === "FAILED" ? "text-danger" : "text-muted"}`,
							children: ASSIGNMENT_LABEL[row.status]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs text-muted",
							children: when(row.updatedAt)
						})]
					})]
				}) }, row.id))
			})
		]
	});
}
//#endregion
export { OperationsPage as component };
