import { o as __toESM } from "../_runtime.mjs";
import { s as MISSION_LABEL, x as formatMoney } from "./company-cyOhrTv5.mjs";
import { C as require_jsx_runtime, X as require_react, b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useReadySession, t as Shell } from "./shell-B6Ot8wFZ.mjs";
import { i as controlClass, n as Button, t as Alert } from "./nexus-ui-D8VU1C9e.mjs";
import { i as useCompany, r as errorText, t as companyCommand } from "./use-company-5WhiurfJ.mjs";
import { n as RunTokenNote, t as PayCard } from "./company-notes-DJRl-QXj.mjs";
import { t as AccessPanel } from "./access-panel-Dmqscbbv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CejfonT3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const { user, pending } = useReadySession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landing, { holdAuth: true }) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landing, {}) });
}
function Landing({ holdAuth = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-muted",
				children: "Virtual company"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 max-w-xl text-3xl font-medium leading-tight",
				children: "One owner. One command center. A workforce with a record."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-xl text-sm leading-relaxed text-muted",
				children: "NEXUS turns an objective into a mission. Executive plans it. Research, product, architecture, design, and engineering produce the work. Quality checks the artifacts. You accept or reject the packet."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-6 max-w-xl space-y-2 text-sm",
				children: [
					"You establish the mission",
					"The CEO writes a plan and waits",
					"You authorize execution",
					"Departments hand off structured work",
					"Quality computes pass or fail",
					"You accept the packet, or send it back"
				].map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-accent tabular-nums",
						children: index + 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step })]
				}, step))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 max-w-xl text-sm text-muted",
				children: "Agents cannot deploy, spend money, or accept their own work. Each department run is a step you start. Writing uses GPT-OSS 20B, a free public model."
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [holdAuth ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Checking session"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccessPanel, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-6 space-y-3 text-sm",
			children: [
				["Executive", "Plan and coordinate"],
				["Research", "Constraints and sources"],
				["Engineering", "Design and implementation"],
				["Creative", "Interface"],
				["Quality", "Independent verification"],
				["Governance", "Your approval, on the record"]
			].map(([name, duty]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "border-t border-line pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-medium",
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted",
					children: duty
				})]
			}, name))
		})] })]
	});
}
function GithubPanel({ github, busy, onDone, onError }) {
	const [token, setToken] = (0, import_react.useState)("");
	const [repos, setRepos] = (0, import_react.useState)("");
	const [resource, setResource] = (0, import_react.useState)("");
	const [operation, setOperation] = (0, import_react.useState)("repo");
	async function send(type, extra) {
		onError(null);
		try {
			await companyCommand({ data: {
				type,
				...extra
			} });
			setToken("");
			onDone();
		} catch (err) {
			setToken("");
			onError(errorText(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 max-w-xl space-y-3 border-t border-line pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-medium",
				children: "GitHub"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: github.status === "connected" ? `Connected as ${github.account}` : `Status: ${github.status}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: github.polling
			}),
			github.scopes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Scopes: ", github.scopes]
			}) : null,
			github.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Credential hint: ", github.hint]
			}) : null,
			github.rate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Rate limit: ", github.rate]
			}) : null,
			github.lastSuccess ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Last success: ", github.lastSuccess]
			}) : null,
			github.lastFailure ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Last failure: ", github.lastFailure]
			}) : null,
			github.repos.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: github.repos.map((repo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "text-sm",
					children: [repo.fullName, repo.private ? " · private, contents withheld" : ""]
				}, repo.fullName))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No repository has been retrieved."
			}),
			github.recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: github.recent.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "font-mono text-xs text-muted",
					children: [
						item.result,
						" · ",
						item.operation,
						" · ",
						item.resource,
						" · ",
						item.httpStatus
					]
				}, `${item.createdAt}:${item.operation}:${item.resource}`))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: token,
				onChange: (event) => setToken(event.target.value),
				type: "password",
				autoComplete: "off",
				placeholder: "Read-only token",
				className: `${controlClass} h-11`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: repos,
				onChange: (event) => setRepos(event.target.value),
				placeholder: "Optional owner/name, comma separated",
				className: `${controlClass} h-11`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy || token.trim().length < 8,
						onClick: () => void send("github-connect", {
							secret: token,
							note: repos
						}),
						children: "Verify and connect"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy || github.status !== "connected",
						onClick: () => void send("github-refresh", {}),
						children: "Refresh repositories"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy || github.status === "not connected",
						onClick: () => void send("github-disconnect", {}),
						children: "Disconnect"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy || github.status === "not connected",
						onClick: () => void send("github-revoke", {}),
						children: "Revoke"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: operation,
						onChange: (event) => setOperation(event.target.value),
						className: `${controlClass} h-11 max-w-[10rem]`,
						children: [
							"repo",
							"branches",
							"commits",
							"pulls",
							"issues",
							"workflows"
						].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item,
							children: item
						}, item))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: resource,
						onChange: (event) => setResource(event.target.value),
						placeholder: "owner/name",
						className: `${controlClass} h-11 max-w-xs`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy || github.status !== "connected",
						onClick: () => void send("github-read", {
							objective: operation,
							note: resource,
							department: "engineering"
						}),
						children: "Read"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "A token is sent once, sealed, and never shown again. Write operations are not available. Without an encryption key, nothing is stored."
			})
		]
	});
}
function WorldDesk({ busy, onDone, onError }) {
	const [provider, setProvider] = (0, import_react.useState)("");
	const [model, setModel] = (0, import_react.useState)("");
	const [inputRate, setInputRate] = (0, import_react.useState)("");
	const [outputRate, setOutputRate] = (0, import_react.useState)("");
	const [service, setService] = (0, import_react.useState)("");
	async function send(type, extra) {
		onError(null);
		try {
			await companyCommand({ data: {
				type,
				...extra
			} });
			onDone();
		} catch (err) {
			onError(errorText(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 max-w-xl space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Enter a price only if you know it. Leave a box blank and that dimension stays unknown. This does not fetch a provider's price list."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: provider,
						onChange: (event) => setProvider(event.target.value),
						placeholder: "Provider",
						className: `${controlClass} h-11`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: model,
						onChange: (event) => setModel(event.target.value),
						placeholder: "Model",
						className: `${controlClass} h-11`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: inputRate,
						onChange: (event) => setInputRate(event.target.value),
						placeholder: "Input cents / million",
						className: `${controlClass} h-11`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: outputRate,
						onChange: (event) => setOutputRate(event.target.value),
						placeholder: "Output cents / million",
						className: `${controlClass} h-11`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy || !provider.trim() || !model.trim(),
						onClick: () => void send("price", {
							note: `${provider}/${model}`,
							amount: inputRate,
							objective: outputRate
						}),
						children: "Record price"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy,
						onClick: () => void send("cost-policy", { note: "refuse" }),
						children: "Refuse unpriced calls"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						disabled: busy,
						onClick: () => void send("cost-policy", { note: "record_unknown" }),
						children: "Allow unknown cost"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: service,
					onChange: (event) => setService(event.target.value),
					placeholder: "Service name",
					className: `${controlClass} h-11 max-w-xs`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "quiet",
					disabled: busy || service.trim().length < 2,
					onClick: () => void send("integration", {
						note: service,
						policy: "information",
						objective: "read"
					}),
					children: "Register, not connect"
				})]
			})
		]
	});
}
function Command() {
	const navigate = useNavigate();
	const { data, error, loading, reload } = useCompany("command");
	const [objective, setObjective] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [formError, setFormError] = (0, import_react.useState)(null);
	async function submit(event) {
		event.preventDefault();
		setBusy(true);
		setFormError(null);
		try {
			const result = await companyCommand({ data: {
				type: "submit",
				objective
			} });
			if (result && "missionId" in result) await navigate({
				to: "/missions/$missionId",
				params: { missionId: result.missionId }
			});
		} catch (err) {
			setFormError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	if (loading && !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Opening the company"
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error ?? "The company did not load." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-3 text-sm text-accent",
			onClick: reload,
			children: "Retry"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-muted",
				children: data.organization.role
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-2xl font-medium",
				children: data.organization.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "mt-4 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4",
				children: [
					["Missions", data.counts.missions],
					["In motion", data.counts.executing],
					["Awaiting you", data.counts.awaiting],
					["Open defects", data.counts.defects]
				].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-bg px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs text-muted",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-1 font-mono text-lg tabular-nums",
						children: value
					})]
				}, String(label)))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 border border-line bg-surface px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Business"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/business",
						className: "text-sm text-accent",
						children: "Open the record"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: data.business.name ? `${data.business.name} is in ${data.business.stage}. ${data.business.openObligations} obligations are still open. ${data.business.restrictedOpen} must be done by a person, not an agent.` : "No business record yet. Opening one coordinates formation, money, product, market, operations, and people. It does not create a second company."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (event) => void submit(event),
				className: "mt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "mission",
						className: "text-sm font-medium",
						children: "New mission"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: "mission",
						value: objective,
						onChange: (event) => setObjective(event.target.value),
						placeholder: "Build a contractor desk that tracks jobs and drafts invoices.",
						className: `${controlClass} mt-2 min-h-28 py-3`
					}),
					formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: formError })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "mt-3",
						disabled: busy || objective.trim().length < 8,
						children: busy ? "Filing…" : "Establish the mission"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Active record"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/missions",
						className: "text-sm text-accent",
						children: "All missions"
					})]
				}), data.missions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "No missions. The workforce is standing by until you set an objective."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 divide-y divide-line border-y border-line",
					children: data.missions.slice(0, 8).map((mission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/missions/$missionId",
						params: { missionId: mission.id },
						className: "flex min-h-11 items-center justify-between gap-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm",
								children: mission.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-muted tabular-nums",
								children: [
									"P",
									mission.priority,
									" · ",
									mission.done,
									"/",
									mission.total || "—",
									" departments",
									mission.parentId ? " · subordinate" : ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Status, { status: mission.status })]
					}) }, mission.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Operational findings"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Recorded items come from the company record. An inferred item says so and is not a fact."
					}),
					data.findings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "No open finding. That is the record, not a prediction that nothing will fail."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-3",
						children: data.findings.map((finding) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "border-t border-line pt-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: finding.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: finding.evidence
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: finding.recommendation
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-mono text-xs text-muted",
									children: [
										finding.severity,
										" · ",
										finding.confidence,
										finding.ownerRequired ? " · owner" : ""
									]
								})
							]
						}, finding.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Resources on record"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Running ",
							data.resources.running,
							" of ",
							data.resources.capacity,
							". Queue ",
							data.resources.queue,
							". Quality ",
							data.resources.qaPassed,
							" passed, ",
							data.resources.qaFailed,
							" failed. Model dispatches ",
							data.resources.dispatches,
							". Accepted knowledge ",
							data.resources.acceptedKnowledge,
							", contested ",
							data.resources.contested,
							", reused ",
							data.resources.reused,
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: data.resources.avgDurationMs === null ? "Average execution time is not shown. No finished execution job is on record." : `Average finished execution ${Math.round(data.resources.avgDurationMs / 1e3)}s, from completed jobs only.`
					}),
					data.handoffs.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-1",
						children: data.handoffs.map((handoff) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-sm text-muted",
							children: [
								handoff.fromDepartment,
								" → ",
								handoff.toDepartment
							]
						}, handoff.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "No department handoff has been stored yet."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Change control"
				}), data.changes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "No specification version has been filed. An accepted mission records its specification when you accept it. A later edit is a new version."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3",
					children: data.changes.map((change) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-line pt-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Version ",
							change.version,
							" · ",
							change.state,
							" · review ",
							change.revalidation
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-muted",
							children: [
								change.added,
								" added, ",
								change.removed,
								" removed, ",
								change.affected,
								" deliverables traced. Unaffected work is not in that count."
							]
						})]
					}, change.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "Financial control"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Received ",
							formatMoney(data.finance.receivedCents),
							". Spent ",
							formatMoney(data.finance.spentCents),
							". Reserved ",
							formatMoney(data.finance.reservedCents),
							". Estimates ",
							formatMoney(data.finance.estimateCents),
							" do not consume the ceiling. Receipts do not either."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: data.finance.ceilingCents == null ? "No spending ceiling is set. Remaining budget is unavailable, not zero and not unlimited as a measured figure." : `Ceiling ${formatMoney(data.finance.ceilingCents)}. Remaining ${formatMoney(data.finance.remainingCents ?? 0)}. Utilization ${Math.round((data.finance.utilization ?? 0) * 100)}%, from expenditures and open reservations.`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Provider reliability"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3",
					children: data.providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-line pt-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [provider.provider, provider.model ? ` · ${provider.model}` : ""] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-muted",
								children: provider.note
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-xs text-muted",
								children: [
									"Attempts ",
									provider.attempts,
									". Withheld ",
									provider.withheld,
									". Unspecified ",
									provider.unspecified,
									".",
									provider.measured ? ` Success ${Math.round((provider.successRate ?? 0) * 100)}%. Failure ${Math.round((provider.failureRate ?? 0) * 100)}%. Timeout ${Math.round((provider.timeoutRate ?? 0) * 100)}%.` : " Rates hidden.",
									provider.averageMs == null ? " Duration unavailable." : ` Average ${provider.averageMs} ms.`,
									provider.periodStart ? ` Period ${provider.periodStart} to ${provider.periodEnd}.` : "",
									provider.lastOutcome ? ` Last ${provider.lastOutcome}.` : ""
								]
							})
						]
					}, `${provider.provider}:${provider.model}`))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "External world"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Unknown-cost policy: ",
							data.world.policy === "refuse" ? "refuse the call" : "record the cost as unknown",
							". Prices on record: ",
							data.world.prices,
							". Unknown cost rows: ",
							data.world.unknownCosts,
							". Estimates: ",
							data.world.estimates,
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: data.world.forecast
					}),
					data.world.integrations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "No external service is registered. A registry row would still not mean the service is connected."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: data.world.integrations.map((integration) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-sm",
							children: [
								integration.name,
								" · ",
								integration.category,
								" · ",
								integration.label
							]
						}, integration.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Actions waiting on you: ",
							data.world.pendingActions,
							". Observations stored, not accepted as knowledge: ",
							data.world.observations,
							".",
							" ",
							"Maintenance proposed ",
							data.world.maintenanceProposed,
							", applied ",
							data.world.maintenanceApplied,
							". Delivery waiting ",
							data.world.outboxPending,
							", dead ",
							data.world.outboxDead,
							". ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/operations",
								className: "text-accent",
								children: "Open the operational record"
							}),
							"."
						]
					}),
					data.world.devices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "No device is registered. Nothing physical is being monitored or controlled."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: data.world.devices.map((device) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-sm",
							children: [
								device.name,
								" · ",
								device.permission,
								" · ",
								device.connected ? "connected" : "not connected",
								device.emergencyStop ? " · emergency stop set" : ""
							]
						}, device.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorldDesk, {
						busy,
						onDone: reload,
						onError: setFormError
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GithubPanel, {
						github: data.world.github,
						busy,
						onDone: reload,
						onError: setFormError
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-medium",
						children: "How a department run is locked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 max-w-xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RunTokenNote, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted",
						children: [
							"Model policy: ",
							data.disclosure === "public" ? "public. Internal work may use the free model. Confidential work never does." : "local. Objectives stay in this workspace.",
							" ",
							"Scheduler: ",
							data.scheduler.status,
							". Queue ",
							data.scheduler.queue,
							". Workers: ",
							data.workers.leased,
							" leased, ",
							data.workers.retry,
							" waiting to retry, ",
							data.workers.dead,
							" dead."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/governance",
								className: "text-accent",
								children: "Change the model policy"
							}),
							" · ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/blueprint",
								className: "text-accent",
								children: "Operating contract"
							})
						]
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mt-4 text-sm text-danger",
				onClick: reload,
				children: [error, " Retry"]
			}) : null
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "space-y-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Departments"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-3",
					children: data.departments.map((department) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-line pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: department.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-muted tabular-nums",
								children: [department.open, " open"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: department.mandate
						})]
					}, department.slug))
				})] }),
				data.awaiting.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Waiting for you"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-2",
					children: data.awaiting.map((mission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/missions/$missionId",
						params: { missionId: mission.id },
						className: "text-sm text-accent",
						children: mission.title
					}) }, mission.id))
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayCard, {
					recordedCents: data.counts.recordedCents,
					recordedLabel: "Received"
				}),
				data.recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Latest record"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 space-y-2",
					children: data.recent.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs",
							children: event.action
						}), event.target?.startsWith("msn_") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/missions/$missionId",
							params: { missionId: event.target },
							className: "mt-0.5 block text-xs text-accent",
							children: event.detail || "Open the mission"
						}) : event.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-xs text-muted",
							children: event.detail
						}) : null]
					}, event.id))
				})] }) : null
			]
		})]
	});
}
function Status({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `shrink-0 font-mono text-xs ${status === "REJECTED" || status === "CANCELLED" ? "text-danger" : status === "AWAITING_ACCEPTANCE" || status === "ACCEPTED" ? "text-accent" : "text-muted"}`,
		children: MISSION_LABEL[status]
	});
}
//#endregion
export { Home as component };
