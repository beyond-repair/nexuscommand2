import { o as __toESM } from "../_runtime.mjs";
import { a as DEPARTMENTS, x as formatMoney } from "./company-cyOhrTv5.mjs";
import { C as require_jsx_runtime, X as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useReadySession, t as Shell } from "./shell-B6Ot8wFZ.mjs";
import { i as controlClass, n as Button, r as Field, t as Alert } from "./nexus-ui-D8VU1C9e.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-C3f1xwne.mjs";
import { i as useCompany, n as createSsrRpc, r as errorText } from "./use-company-5WhiurfJ.mjs";
import { n as STRUCTURES, t as STAGES } from "./venture-Apl_n6dM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/business-Cpr5ZU1w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function text(value, max = 4e3) {
	return typeof value === "string" ? value.slice(0, max) : "";
}
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
}).middleware([authMiddleware]).handler(createSsrRpc("979f8a8981408844fba215888b7f1ff9e02f979e94c7fd9d0fa5daa5bfd67aa3"));
var TABS = [
	"Record",
	"Formation",
	"Finance",
	"Sales",
	"Product",
	"Market",
	"Operations",
	"People"
];
var STAGE_LABEL = {
	concept: "Concept",
	viability: "Viability",
	formation: "Formation",
	capitalization: "Capital",
	build: "Build",
	launch: "Launch",
	operating: "Operating",
	closed: "Closed"
};
var STRUCTURE_LABEL = {
	undecided: "Undecided",
	sole_proprietorship: "Sole proprietorship",
	partnership: "Partnership",
	llc: "LLC",
	corporation: "Corporation"
};
var DOMAIN_LABEL = {
	formation: "Formation",
	governance: "Governance",
	finance: "Finance",
	product: "Product",
	market: "Market",
	operations: "Operations",
	people: "People",
	quality: "Launch authority"
};
function BusinessPage() {
	const { user, pending } = useReadySession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Checking session"
	}) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "py-8 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			className: "text-accent",
			children: "Sign in"
		}), " to open the business record."]
	}) });
}
function Desk() {
	const { data, error, loading, reload } = useCompany("business");
	const [tab, setTab] = (0, import_react.useState)("Record");
	const [formError, setFormError] = (0, import_react.useState)(null);
	if (loading && !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Loading the business record"
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error ?? "The business record did not load." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-3 text-sm text-accent",
			onClick: reload,
			children: "Retry"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs text-muted",
				children: "One company. One record."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-2xl font-medium",
				children: data.venture?.name ?? "Business"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm text-muted",
				children: "NEXUS prepares and records. It does not give legal advice, file with a government, move a bank account, publish, or bind the company. Restricted actions stay with a person."
			}),
			formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: formError })
			}) : null,
			data.venture ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "-mx-4 mt-6 flex gap-1 overflow-x-auto px-4",
				children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(item),
					className: `inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-sm ${tab === item ? "border-accent text-fg" : "border-transparent text-muted"}`,
					children: item
				}, item))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6",
				children: [
					tab === "Record" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordTab, {
						data,
						reload,
						onError: setFormError
					}) : null,
					tab === "Formation" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormationTab, {
						data,
						reload,
						onError: setFormError
					}) : null,
					tab === "Finance" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinanceTab, {
						data,
						reload,
						onError: setFormError
					}) : null,
					tab === "Sales" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SalesTab, {
						data,
						reload,
						onError: setFormError
					}) : null,
					tab === "Product" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductTab, {
						data,
						reload,
						onError: setFormError
					}) : null,
					tab === "Market" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketTab, {
						data,
						reload,
						onError: setFormError
					}) : null,
					tab === "Operations" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperationsTab, {
						data,
						reload,
						onError: setFormError
					}) : null,
					tab === "People" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleTab, {
						data,
						reload,
						onError: setFormError
					}) : null
				]
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenForm, {
				reload,
				onError: setFormError
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mt-6 text-sm text-danger",
				onClick: reload,
				children: [error, " Retry"]
			}) : null
		]
	});
}
function OpenForm({ reload, onError }) {
	const [name, setName] = (0, import_react.useState)("");
	const [idea, setIdea] = (0, import_react.useState)("");
	const [structure, setStructure] = (0, import_react.useState)("undecided");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(event) {
		event.preventDefault();
		setBusy(true);
		onError(null);
		try {
			await businessCommand({ data: {
				type: "open",
				name,
				idea,
				kind: structure
			} });
			reload();
		} catch (err) {
			onError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: (event) => void submit(event),
		className: "mt-8 max-w-xl space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Business name",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (event) => setName(event.target.value),
					className: `${controlClass} h-11`
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Idea",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: idea,
					onChange: (event) => setIdea(event.target.value),
					className: `${controlClass} min-h-28 py-3`,
					placeholder: "Who it is for, and what it will sell."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Structure to research",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: structure,
					onChange: (event) => setStructure(event.target.value),
					className: `${controlClass} h-11`,
					children: STRUCTURES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: item,
						children: STRUCTURE_LABEL[item]
					}, item))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Opening the record coordinates formation, money, product, market, operations, and people. It does not register the business, and it does not rename this workspace."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				disabled: busy || name.trim().length < 2 || idea.trim().length < 8,
				children: busy ? "Opening…" : "Open the business record"
			})
		]
	});
}
function RecordTab({ data, reload, onError }) {
	const venture = data.venture;
	if (!venture) return null;
	const [stage, setStage] = (0, import_react.useState)(venture.stage);
	const [structure, setStructure] = (0, import_react.useState)(venture.structure);
	const [burn, setBurn] = (0, import_react.useState)(venture.monthlyBurnCents ? (venture.monthlyBurnCents / 100).toFixed(2) : "");
	const [launchNote, setLaunchNote] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)(data.obligations[0]?.id ?? "");
	const obligation = data.obligations.find((item) => item.id === selected) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: venture.idea
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 grid gap-3 sm:grid-cols-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Stage",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: stage,
							onChange: (event) => setStage(event.target.value),
							className: `${controlClass} h-11`,
							children: STAGES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item,
								children: STAGE_LABEL[item]
							}, item))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Structure",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: structure,
							onChange: (event) => setStructure(event.target.value),
							className: `${controlClass} h-11`,
							children: STRUCTURES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item,
								children: STRUCTURE_LABEL[item]
							}, item))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Monthly burn",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: burn,
							onChange: (event) => setBurn(event.target.value),
							inputMode: "decimal",
							placeholder: "2500.00",
							className: `${controlClass} h-11`
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Save stage",
						run: () => businessCommand({ data: {
							type: "stage",
							note: stage
						} })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Save structure",
						run: () => businessCommand({ data: {
							type: "structure",
							kind: structure
						} })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Save burn",
						run: () => businessCommand({ data: {
							type: "burn",
							amount: burn
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted",
				children: [
					"Outstanding ",
					venture.outstanding,
					". Fulfilled ",
					venture.fulfilled,
					". Waived ",
					venture.waived,
					".",
					venture.launchAuthorized ? " A person recorded launch authorization. NEXUS did not verify it." : " No human launch authorization.",
					venture.ready ? " Launch readiness is recorded." : " Launch is not ready.",
					venture.operating ? " The record is operating." : " The record is not operating.",
					"A waiver does not authorize launch. A finished mission does not either."
				]
			}),
			venture.launchAuthorized ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: venture.launchEvidence
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 max-w-xl space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "How you authorized launch",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: launchNote,
						onChange: (event) => setLaunchNote(event.target.value),
						className: `${controlClass} min-h-20 py-3`
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Record that I authorized launch",
					run: () => businessCommand({ data: {
						type: "authorize-launch",
						objective: launchNote
					} })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 divide-y divide-line border-y border-line",
				children: data.obligations.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSelected(item.id),
					className: "flex min-h-11 w-full items-start justify-between gap-3 py-3 text-left",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-sm",
						children: item.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono text-xs text-muted",
						children: [
							DOMAIN_LABEL[item.domain],
							" · ",
							autonomyLabel(item.autonomy),
							" · ",
							item.state === "authorized" ? "staffed" : item.state === "satisfied" ? "fulfilled" : item.state === "open" ? "outstanding" : item.state
						]
					})] })
				}) }, item.id))
			}),
			obligation ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ObligationPanel, {
				item: obligation,
				reload,
				onError
			}) : null
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Statement, { data })]
	});
}
function autonomyLabel(value) {
	if (value === "restricted") return "person";
	if (value === "authorized") return "owner may staff";
	return "research";
}
function ObligationPanel({ item, reload, onError }) {
	const [text, setText] = (0, import_react.useState)(item.detail || item.evidence || "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: item.title
			}),
			item.missionId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/missions/$missionId",
					params: { missionId: item.missionId },
					className: "text-accent",
					children: "Proposed mission"
				}), ". It is not authorized to execute."]
			}) : null,
			item.evidence ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: item.evidence
			}) : null,
			item.state === "satisfied" || item.state === "waived" || item.state === "authorized" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: text,
				onChange: (event) => setText(event.target.value),
				className: `${controlClass} mt-3 min-h-24 py-3`,
				placeholder: item.autonomy === "restricted" ? "What a person did, and where." : "What was prepared."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [item.autonomy === "restricted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Record outside action",
					run: () => businessCommand({ data: {
						type: "record",
						recordId: item.id,
						objective: text
					} })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Save preparation",
					run: () => businessCommand({ data: {
						type: "prepare",
						recordId: item.id,
						objective: text
					} })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Staff a mission",
					run: () => businessCommand({ data: {
						type: "staff",
						recordId: item.id
					} })
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Waive",
					run: () => businessCommand({ data: {
						type: "waive",
						recordId: item.id,
						objective: text
					} })
				})]
			})] })
		]
	});
}
function Statement({ data }) {
	const row = data.statement;
	const lines = [
		["Received", formatMoney(row.receivedCents)],
		["Spent", formatMoney(row.spentCents)],
		["Recorded margin", formatMoney(row.recordedMarginCents)],
		["Runway", row.runwayMonths == null ? "Set a burn" : `${row.runwayMonths} mo`],
		["Planned costs", formatMoney(row.plannedCostCents)],
		["Funding marked", formatMoney(row.fundingMarkedReceivedCents)],
		["Receivable", formatMoney(row.receivableCents)],
		["Payable", formatMoney(row.payableCents)]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-medium",
			children: "Recorded position"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
			className: "mt-3 divide-y divide-line border-y border-line",
			children: lines.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
					className: "text-sm text-muted",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: "font-mono text-sm tabular-nums",
					children: value
				})]
			}, label))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: row.note
		})
	] });
}
function FormationTab({ data, reload, onError }) {
	const [kind, setKind] = (0, import_react.useState)("license");
	const [jurisdiction, setJurisdiction] = (0, import_react.useState)("");
	const [deadline, setDeadline] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [docKind, setDocKind] = (0, import_react.useState)("nda");
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-10 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Filings to track"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "A row is a reminder. Recording that you filed it does not mean NEXUS submitted it."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Kind",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: kind,
							onChange: (event) => setKind(event.target.value),
							className: `${controlClass} h-11`,
							children: [
								"name",
								"dba",
								"ein",
								"license",
								"permit",
								"trademark",
								"tax",
								"insurance",
								"other"
							].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item,
								children: item
							}, item))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Jurisdiction",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: jurisdiction,
							onChange: (event) => setJurisdiction(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Deadline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: deadline,
							onChange: (event) => setDeadline(event.target.value),
							placeholder: "2026-04-15",
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Note",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: note,
							onChange: (event) => setNote(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Add filing",
						run: () => businessCommand({ data: {
							type: "filing",
							kind,
							jurisdiction,
							deadline,
							note
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 divide-y divide-line border-y border-line",
				children: data.filings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-3 text-sm text-muted",
					children: "None yet."
				}) : data.filings.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							item.kind,
							" · ",
							item.status,
							item.jurisdiction ? ` · ${item.jurisdiction}` : "",
							item.deadline ? ` · ${item.deadline}` : ""
						] }),
						item.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-muted",
							children: item.note
						}) : null,
						item.status === "owner_recorded" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordLine, {
							onError,
							onDone: reload,
							placeholder: "I filed this with…",
							type: "record-filing",
							id: item.id
						})
					]
				}, item.id))
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Drafts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Approving a draft is not a signature and not legal advice."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Kind",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: docKind,
							onChange: (event) => setDocKind(event.target.value),
							className: `${controlClass} h-11`,
							children: [
								"operating_agreement",
								"nda",
								"contract",
								"terms",
								"privacy",
								"other"
							].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item,
								children: item.replaceAll("_", " ")
							}, item))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Title",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: title,
							onChange: (event) => setTitle(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Draft",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: body,
							onChange: (event) => setBody(event.target.value),
							className: `${controlClass} min-h-28 py-3`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Save draft",
						run: () => businessCommand({ data: {
							type: "instrument",
							kind: docKind,
							name: title,
							objective: body
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 divide-y divide-line border-y border-line",
				children: data.instruments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-3 text-sm text-muted",
					children: "None yet."
				}) : data.instruments.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							item.title,
							" · ",
							item.kind.replaceAll("_", " "),
							" · ",
							item.status === "owner_approved" ? "draft approved" : "draft"
						] }),
						item.body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 line-clamp-3 text-muted",
							children: item.body
						}) : null,
						item.status === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
								onError,
								onDone: reload,
								label: "Approve draft",
								run: () => businessCommand({ data: {
									type: "approve-instrument",
									recordId: item.id
								} })
							})
						}) : null
					]
				}, item.id))
			})
		] })]
	});
}
function FinanceTab({ data, reload, onError }) {
	const [kind, setKind] = (0, import_react.useState)("cost");
	const [funding, setFunding] = (0, import_react.useState)("loan");
	const [name, setName] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [direction, setDirection] = (0, import_react.useState)("receivable");
	const [partyId, setPartyId] = (0, import_react.useState)("");
	const [title, setTitle] = (0, import_react.useState)("");
	const [invoiceAmount, setInvoiceAmount] = (0, import_react.useState)("");
	const [invoiceId, setInvoiceId] = (0, import_react.useState)("");
	const [paymentId, setPaymentId] = (0, import_react.useState)("");
	const [alloc, setAlloc] = (0, import_react.useState)("");
	const parties = data.parties.filter((party) => party.status === "active");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Capital plan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "A cost is a plan. Funding marked received is not cash until you record a receipt on Payments."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					onSubmit: (event) => event.preventDefault(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Kind",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: kind,
								onChange: (event) => setKind(event.target.value),
								className: `${controlClass} h-11`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "cost",
									children: "Startup cost"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "funding",
									children: "Funding"
								})]
							})
						}),
						kind === "funding" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Source",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: funding,
								onChange: (event) => setFunding(event.target.value),
								className: `${controlClass} h-11`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "loan",
										children: "Loan"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "investment",
										children: "Investment"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "grant",
										children: "Grant"
									})
								]
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: name,
								onChange: (event) => setName(event.target.value),
								className: `${controlClass} h-11`
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Amount",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: amount,
								onChange: (event) => setAmount(event.target.value),
								inputMode: "decimal",
								className: `${controlClass} h-11`
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Add to the plan",
						run: () => businessCommand({ data: {
							type: "capital",
							kind,
							name,
							amount,
							note: funding
						} })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 divide-y divide-line border-y border-line",
					children: data.capital.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "py-3 text-sm text-muted",
						children: "No plan lines."
					}) : data.capital.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-wrap items-center justify-between gap-3 py-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								item.name,
								" · ",
								item.kind,
								item.fundingKind ? ` · ${item.fundingKind}` : "",
								" · ",
								item.status
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono tabular-nums",
								children: formatMoney(item.amountCents)
							}),
							item.kind === "funding" && item.status !== "received" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
								onError,
								onDone: reload,
								label: "Mark received",
								run: () => businessCommand({ data: {
									type: "capital-status",
									recordId: item.id,
									kind: "received"
								} })
							}) : null
						]
					}, item.id))
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium",
					children: "Invoices"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Issuing an invoice does not collect or pay it. Allocate only a matching receipt or expenditure."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					onSubmit: (event) => event.preventDefault(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Direction",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: direction,
								onChange: (event) => setDirection(event.target.value),
								className: `${controlClass} h-11`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "receivable",
									children: "Customer owes"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "payable",
									children: "We owe a supplier"
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Party",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: partyId,
								onChange: (event) => setPartyId(event.target.value),
								className: `${controlClass} h-11`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Choose"
								}), parties.map((party) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: party.id,
									children: party.displayName
								}, party.id))]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Title",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: title,
								onChange: (event) => setTitle(event.target.value),
								className: `${controlClass} h-11`
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Amount",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: invoiceAmount,
								onChange: (event) => setInvoiceAmount(event.target.value),
								inputMode: "decimal",
								className: `${controlClass} h-11`
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Draft invoice",
						run: () => businessCommand({ data: {
							type: "invoice",
							kind: direction,
							partyId,
							name: title,
							amount: invoiceAmount
						} })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 divide-y divide-line border-y border-line",
					children: data.invoices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "py-3 text-sm text-muted",
						children: "No invoices. Add the customer or supplier on Payments first."
					}) : data.invoices.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "py-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								item.number ? `${item.number} · ` : "",
								item.title,
								" · ",
								item.partyName,
								" · ",
								item.status
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-mono text-xs text-muted tabular-nums",
								children: [
									formatMoney(item.allocatedCents),
									" of ",
									formatMoney(item.amountCents)
								]
							}),
							item.status === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
									onError,
									onDone: reload,
									label: "Issue",
									run: () => businessCommand({ data: {
										type: "issue-invoice",
										recordId: item.id
									} })
								})
							}) : null
						]
					}, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 grid gap-3 sm:grid-cols-3",
					onSubmit: (event) => event.preventDefault(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Issued invoice",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: invoiceId,
								onChange: (event) => setInvoiceId(event.target.value),
								className: `${controlClass} h-11`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Choose"
								}), data.invoices.filter((item) => item.status === "issued").map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: item.id,
									children: item.title
								}, item.id))]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Open payment",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: paymentId,
								onChange: (event) => setPaymentId(event.target.value),
								className: `${controlClass} h-11`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Choose"
								}), data.payments.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: item.id,
									children: [
										item.direction,
										" ",
										item.payer,
										" ",
										formatMoney(item.amountCents - item.allocatedCents)
									]
								}, item.id))]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Allocate",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: alloc,
								onChange: (event) => setAlloc(event.target.value),
								inputMode: "decimal",
								className: `${controlClass} h-11`
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Allocate",
						run: () => businessCommand({ data: {
							type: "allocate",
							recordId: invoiceId,
							paymentId,
							amount: alloc
						} })
					})
				})
			] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Statement, { data })]
	});
}
function SalesTab({ data, reload, onError }) {
	const customers = data.parties.filter((party) => party.status === "active" && party.roles.some((role) => role.role === "customer" && role.status === "active"));
	const activeOffers = data.offers.filter((offer) => offer.status === "active");
	const [partyId, setPartyId] = (0, import_react.useState)(customers[0]?.id ?? "");
	const [note, setNote] = (0, import_react.useState)("");
	const [offerId, setOfferId] = (0, import_react.useState)(activeOffers[0]?.id ?? "");
	const [quantity, setQuantity] = (0, import_react.useState)("1");
	const [price, setPrice] = (0, import_react.useState)("");
	const [missionId, setMissionId] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-2xl space-y-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Quotes"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "A quote goes to a customer. Issuing it does not create an order. Accepting it does not take payment or authorize a mission."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 grid gap-3 sm:grid-cols-2",
				onSubmit: (event) => event.preventDefault(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Customer",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: partyId,
						onChange: (event) => setPartyId(event.target.value),
						className: `${controlClass} h-11`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Choose"
						}), customers.map((party) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: party.id,
							children: party.displayName
						}, party.id))]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Note",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: note,
						onChange: (event) => setNote(event.target.value),
						className: `${controlClass} h-11`
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Draft quote",
					run: () => businessCommand({ data: {
						type: "quote",
						partyId,
						note
					} })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.quotes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-3 text-sm text-muted",
					children: "No quotes. A customer role is required."
				}) : data.quotes.map((quote) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							quote.partyName,
							" · ",
							quote.status,
							" · ",
							formatMoney(quote.totalCents)
						] }),
						quote.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted",
							children: quote.note
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-1 text-muted",
							children: quote.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								line.quantity,
								" ",
								line.offerName,
								" · ",
								formatMoney(line.amountCents),
								" total"
							] }, line.id))
						}),
						quote.status === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
								onError,
								onDone: reload,
								label: "Add selected offer",
								run: () => businessCommand({ data: {
									type: "quote-line",
									recordId: quote.id,
									offerId,
									quantity,
									amount: price
								} })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
								onError,
								onDone: reload,
								label: "Issue quote",
								run: () => businessCommand({ data: {
									type: "issue-quote",
									recordId: quote.id
								} })
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
								onError,
								onDone: reload,
								label: "Accept into an order",
								run: () => businessCommand({ data: {
									type: "accept-quote",
									recordId: quote.id
								} })
							})
						})
					]
				}, quote.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 grid gap-3 sm:grid-cols-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Offer for the next line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: offerId,
							onChange: (event) => setOfferId(event.target.value),
							className: `${controlClass} h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Choose"
							}), activeOffers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: offer.id,
								children: offer.name
							}, offer.id))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Quantity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: quantity,
							onChange: (event) => setQuantity(event.target.value),
							inputMode: "numeric",
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Unit price, optional",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: price,
							onChange: (event) => setPrice(event.target.value),
							inputMode: "decimal",
							placeholder: "Uses the offer",
							className: `${controlClass} h-11`
						})
					})
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Orders"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Cancelling an order leaves its lines and does not cancel a linked mission. An invoice is still not a receipt."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Mission to link",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: missionId,
					onChange: (event) => setMissionId(event.target.value),
					className: `${controlClass} mt-2 h-11`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Choose"
					}), data.missions.map((mission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: mission.id,
						children: mission.title
					}, mission.id))]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-3 text-sm text-muted",
					children: "No orders."
				}) : data.orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							order.partyName,
							" · ",
							order.status,
							" · ",
							formatMoney(order.totalCents),
							order.invoiceNumber ? ` · ${order.invoiceNumber}` : ""
						] }),
						order.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted",
							children: order.note
						}) : null,
						order.missionIds.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted",
							children: [
								order.missionIds.length,
								" linked mission",
								order.missionIds.length === 1 ? "" : "s",
								", still not authorized by this link."
							]
						}) : null,
						order.status === "accepted" || order.status === "fulfilled" && !order.invoiceNumber ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								order.status === "accepted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
									onError,
									onDone: reload,
									label: "Link mission",
									run: () => businessCommand({ data: {
										type: "link-order",
										recordId: order.id,
										missionId
									} })
								}) : null,
								!order.invoiceNumber ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
									onError,
									onDone: reload,
									label: "Invoice",
									run: () => businessCommand({ data: {
										type: "invoice-order",
										recordId: order.id
									} })
								}) : null,
								order.status === "accepted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
									onError,
									onDone: reload,
									label: "Mark fulfilled",
									run: () => businessCommand({ data: {
										type: "fulfill-order",
										recordId: order.id
									} })
								}) : null,
								order.status === "accepted" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
									onError,
									onDone: reload,
									label: "Cancel",
									run: () => businessCommand({ data: {
										type: "cancel-order",
										recordId: order.id
									} })
								}) : null
							]
						}) : null
					]
				}, order.id))
			})
		] })]
	});
}
function ProductTab({ data, reload, onError }) {
	const [offerId, setOfferId] = (0, import_react.useState)("");
	const [problem, setProblem] = (0, import_react.useState)("");
	const [requirements, setRequirements] = (0, import_react.useState)("");
	const [value, setValue] = (0, import_react.useState)("");
	const [cost, setCost] = (0, import_react.useState)("");
	const [stockOffer, setStockOffer] = (0, import_react.useState)("");
	const [onHand, setOnHand] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-2xl space-y-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Product brief"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Price stays on the offer. Cost here is not a charge. Counting stock does not record a sale."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Offer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: offerId,
							onChange: (event) => setOfferId(event.target.value),
							className: `${controlClass} h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "No offer yet"
							}), data.offers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: offer.id,
								children: [
									offer.name,
									" · ",
									formatMoney(offer.priceCents)
								]
							}, offer.id))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Problem",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: problem,
							onChange: (event) => setProblem(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Requirements",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: requirements,
							onChange: (event) => setRequirements(event.target.value),
							className: `${controlClass} min-h-20 py-3`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Value",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value,
							onChange: (event) => setValue(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Cost",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: cost,
							onChange: (event) => setCost(event.target.value),
							inputMode: "decimal",
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Save brief",
						run: () => businessCommand({ data: {
							type: "brief",
							offerId,
							name: problem,
							objective: requirements,
							note: value,
							amount: cost
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.briefs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: item.problem }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-muted",
						children: [item.offerName || "No offer", item.costCents ? ` · cost ${formatMoney(item.costCents)}` : ""]
					})]
				}, item.id))
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Stock count"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 grid gap-3 sm:grid-cols-2",
				onSubmit: (event) => event.preventDefault(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Offer",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: stockOffer,
						onChange: (event) => setStockOffer(event.target.value),
						className: `${controlClass} h-11`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Choose"
						}), data.offers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: offer.id,
							children: offer.name
						}, offer.id))]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "On hand",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: onHand,
						onChange: (event) => setOnHand(event.target.value),
						inputMode: "numeric",
						className: `${controlClass} h-11`
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Save count",
					run: () => businessCommand({ data: {
						type: "stock",
						offerId: stockOffer,
						amount: onHand
					} })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.stock.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						item.offerName,
						" · ",
						item.onHand,
						" on hand"
					]
				}, item.offerId))
			})
		] })]
	});
}
function MarketTab({ data, reload, onError }) {
	const [kind, setKind] = (0, import_react.useState)("segment");
	const [name, setName] = (0, import_react.useState)("");
	const [detail, setDetail] = (0, import_react.useState)("");
	const [campaign, setCampaign] = (0, import_react.useState)("");
	const [segment, setSegment] = (0, import_react.useState)("");
	const [channel, setChannel] = (0, import_react.useState)("");
	const [budget, setBudget] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-10 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Market notes"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Kind",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: kind,
							onChange: (event) => setKind(event.target.value),
							className: `${controlClass} h-11`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "segment",
									children: "Segment"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "competitor",
									children: "Competitor"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "channel",
									children: "Channel"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (event) => setName(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Detail",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: detail,
							onChange: (event) => setDetail(event.target.value),
							className: `${controlClass} min-h-20 py-3`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Add note",
						run: () => businessCommand({ data: {
							type: "market-note",
							kind,
							name,
							objective: detail
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.notes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						item.kind,
						" · ",
						item.name,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-muted",
							children: item.detail
						})
					]
				}, item.id))
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Campaigns"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Authorizing a campaign does not publish it and does not spend the budget."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: campaign,
							onChange: (event) => setCampaign(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Segment",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: segment,
							onChange: (event) => setSegment(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Channel",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: channel,
							onChange: (event) => setChannel(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Budget",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: budget,
							onChange: (event) => setBudget(event.target.value),
							inputMode: "decimal",
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Draft campaign",
						run: () => businessCommand({ data: {
							type: "campaign",
							name: campaign,
							note: segment,
							kind: channel,
							amount: budget
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.campaigns.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							item.name,
							" · ",
							item.status,
							" · ",
							formatMoney(item.budgetCents)
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted",
							children: [
								item.segment,
								" ",
								item.channel
							]
						}),
						item.status === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
								onError,
								onDone: reload,
								label: "Authorize preparation",
								run: () => businessCommand({ data: {
									type: "authorize-campaign",
									recordId: item.id
								} })
							})
						}) : null
					]
				}, item.id))
			})
		] })]
	});
}
function OperationsTab({ data, reload, onError }) {
	const [name, setName] = (0, import_react.useState)("");
	const [owner, setOwner] = (0, import_react.useState)("");
	const [trigger, setTrigger] = (0, import_react.useState)("");
	const [inputs, setInputs] = (0, import_react.useState)("");
	const [actions, setActions] = (0, import_react.useState)("");
	const [outputs, setOutputs] = (0, import_react.useState)("");
	const [exceptions, setExceptions] = (0, import_react.useState)("");
	const [verification, setVerification] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Procedures"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "An active procedure can open a proposed mission. It does not run by itself, and it cannot take a restricted action."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (event) => setName(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Owner",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: owner,
							onChange: (event) => setOwner(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Trigger",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: trigger,
							onChange: (event) => setTrigger(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Inputs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: inputs,
							onChange: (event) => setInputs(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: actions,
							onChange: (event) => setActions(event.target.value),
							className: `${controlClass} min-h-20 py-3`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Outputs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: outputs,
							onChange: (event) => setOutputs(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Exceptions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: exceptions,
							onChange: (event) => setExceptions(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Verification",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: verification,
							onChange: (event) => setVerification(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "Save procedure",
						run: () => businessCommand({ data: {
							type: "procedure",
							name,
							owner,
							trigger,
							inputs,
							actions,
							outputs,
							exceptions,
							verification
						} })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 divide-y divide-line border-y border-line",
				children: data.procedures.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							item.name,
							" · ",
							item.status,
							" · ",
							item.ownerLabel
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted",
							children: [
								"When ",
								item.trigger,
								". Check: ",
								item.verification
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								item.status === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
									onError,
									onDone: reload,
									label: "Activate",
									run: () => businessCommand({ data: {
										type: "activate-procedure",
										recordId: item.id
									} })
								}) : null,
								item.status === "active" && !item.missionId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
									onError,
									onDone: reload,
									label: "Open a mission",
									run: () => businessCommand({ data: {
										type: "run-procedure",
										recordId: item.id
									} })
								}) : null,
								item.missionId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/missions/$missionId",
									params: { missionId: item.missionId },
									className: "inline-flex h-11 items-center text-accent",
									children: "Mission"
								}) : null
							]
						})
					]
				}, item.id))
			})
		]
	});
}
function PeopleTab({ data, reload, onError }) {
	const [title, setTitle] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("employee");
	const [department, setDepartment] = (0, import_react.useState)("");
	const [reportsTo, setReportsTo] = (0, import_react.useState)("");
	const [positionId, setPositionId] = (0, import_react.useState)("");
	const [partyId, setPartyId] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Positions"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Employees and contractors are parties. Agents stay on the workforce and cannot hold a position. This is not payroll."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 grid gap-3 sm:grid-cols-2",
				onSubmit: (event) => event.preventDefault(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Title",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: title,
							onChange: (event) => setTitle(event.target.value),
							className: `${controlClass} h-11`
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Kind",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: kind,
							onChange: (event) => setKind(event.target.value),
							className: `${controlClass} h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "employee",
								children: "Employee"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "contractor",
								children: "Contractor"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Department",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: department,
							onChange: (event) => setDepartment(event.target.value),
							className: `${controlClass} h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "None"
							}), DEPARTMENTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item.slug,
								children: item.name
							}, item.slug))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Reports to",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: reportsTo,
							onChange: (event) => setReportsTo(event.target.value),
							className: `${controlClass} h-11`
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Add position",
					run: () => businessCommand({ data: {
						type: "position",
						name: title,
						kind,
						department,
						reportsTo
					} })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.positions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3 text-sm",
					children: [
						item.title,
						" · ",
						item.kind,
						item.reportsTo ? ` · reports to ${item.reportsTo}` : ""
					]
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 grid gap-3 sm:grid-cols-2",
				onSubmit: (event) => event.preventDefault(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Position",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: positionId,
						onChange: (event) => setPositionId(event.target.value),
						className: `${controlClass} h-11`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Choose"
						}), data.positions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.id,
							children: item.title
						}, item.id))]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Party",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: partyId,
						onChange: (event) => setPartyId(event.target.value),
						className: `${controlClass} h-11`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Choose"
						}), data.parties.filter((party) => party.status === "active").map((party) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: party.id,
							children: party.displayName
						}, party.id))]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
					onError,
					onDone: reload,
					label: "Engage",
					run: () => businessCommand({ data: {
						type: "engage",
						recordId: positionId,
						partyId
					} })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: data.engagements.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 py-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						item.partyName,
						" · ",
						item.status
					] }), item.status === "ended" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
						onError,
						onDone: reload,
						label: "End",
						run: () => businessCommand({ data: {
							type: "end-engagement",
							recordId: item.id
						} })
					})]
				}, item.id))
			})
		]
	});
}
function RecordLine({ type, id, placeholder, onDone, onError }) {
	const [value, setValue] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value,
			onChange: (event) => setValue(event.target.value),
			placeholder,
			className: `${controlClass} h-11`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quiet, {
			onError,
			onDone,
			label: "Record",
			run: () => businessCommand({ data: {
				type,
				recordId: id,
				objective: value
			} })
		})]
	});
}
function Quiet({ label, run, onDone, onError }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		variant: "quiet",
		disabled: busy,
		onClick: () => {
			setBusy(true);
			onError(null);
			run().then(() => onDone()).catch((err) => onError(errorText(err))).finally(() => setBusy(false));
		},
		children: busy ? "Saving…" : label
	});
}
//#endregion
export { BusinessPage as component };
