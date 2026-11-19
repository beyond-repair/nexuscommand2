import { o as __toESM } from "../_runtime.mjs";
import { a as DEPARTMENTS, x as formatMoney, y as dollarsToCents } from "./company-cyOhrTv5.mjs";
import { C as require_jsx_runtime, X as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useReadySession, t as Shell } from "./shell-B6Ot8wFZ.mjs";
import { a as when, i as controlClass, n as Button, t as Alert } from "./nexus-ui-D8VU1C9e.mjs";
import { i as useCompany, r as errorText, t as companyCommand } from "./use-company-5WhiurfJ.mjs";
import { t as PayCard } from "./company-notes-DJRl-QXj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments-Dzz_2TmI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PaymentsPage() {
	const { user, pending } = useReadySession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Checking session"
	}) : user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ledger, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "py-8 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			className: "text-accent",
			children: "Sign in"
		}), " to see payments."]
	}) });
}
function Ledger() {
	const { data, error, loading, reload } = useCompany("payments");
	const [payer, setPayer] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [missionId, setMissionId] = (0, import_react.useState)("");
	const [department, setDepartment] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [voiding, setVoiding] = (0, import_react.useState)(null);
	const [formError, setFormError] = (0, import_react.useState)(null);
	const cents = dollarsToCents(amount);
	async function submit(event) {
		event.preventDefault();
		setBusy(true);
		setFormError(null);
		try {
			await companyCommand({ data: {
				type: "record-payment",
				payer,
				amount,
				note,
				missionId,
				department
			} });
			setPayer("");
			setAmount("");
			setNote("");
			setMissionId("");
			setDepartment("");
			reload();
		} catch (err) {
			setFormError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	if (loading && !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "py-8 text-sm text-muted",
		children: "Loading payments"
	});
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: error ?? "Payments did not load." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-3 text-sm text-accent",
			onClick: reload,
			children: "Retry"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium",
				children: "Payments"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: [
					data.destination.business,
					" is paid at ",
					data.destination.cashtag,
					". A receipt is money you write down after it arrives. It does not consume the spending ceiling, and it is not confirmation from Cash App."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: "An expenditure is money you write down as spent. It counts against the ceiling and any mission or department budget you name. Neither row moves a bank account."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 font-mono text-lg tabular-nums",
				children: [
					"Received ",
					formatMoney(data.totalCents),
					" · Spent ",
					formatMoney(data.finance.spentCents)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: [
					"Reserved ",
					formatMoney(data.finance.reservedCents),
					". Estimates ",
					formatMoney(data.finance.estimateCents),
					" are not charges.",
					data.finance.ceilingCents == null ? " No spending ceiling is set, so remaining budget is not shown." : ` Ceiling ${formatMoney(data.finance.ceilingCents)}. Remaining ${formatMoney(data.finance.remainingCents ?? 0)}.`
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ceiling, {
				busy,
				onDone: reload,
				onError: setFormError
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DepartmentBudget, {
				busy,
				onDone: reload,
				onError: setFormError
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (event) => void submit(event),
				className: "mt-8 max-w-xl space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Who paid", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: payer,
							onChange: (event) => setPayer(event.target.value),
							className: `${controlClass} mt-1 h-11`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Amount", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: amount,
							onChange: (event) => setAmount(event.target.value),
							inputMode: "decimal",
							placeholder: "25.00",
							className: `${controlClass} mt-1 h-11`
						})]
					}),
					amount.trim() && cents == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: "Use an amount like 25 or 25.00."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Mission", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: missionId,
							onChange: (event) => setMissionId(event.target.value),
							className: `${controlClass} mt-1 h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Not tied to a mission"
							}), data.missions.map((mission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: mission.id,
								children: mission.title
							}, mission.id))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Department", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: department,
							onChange: (event) => setDepartment(event.target.value),
							className: `${controlClass} mt-1 h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Company ceiling only"
							}), DEPARTMENTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item.slug,
								children: item.name
							}, item.slug))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Note", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: note,
							onChange: (event) => setNote(event.target.value),
							className: `${controlClass} mt-1 h-11`
						})]
					}),
					formError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Alert, { children: formError }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy || payer.trim().length < 2 || cents == null,
						children: busy ? "Recording…" : cents ? `Record receipt ${formatMoney(cents)}` : "Record the receipt"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenditureForm, {
				missions: data.missions,
				onDone: reload,
				onError: setFormError
			}),
			data.rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-sm text-muted",
				children: "Nothing recorded yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-8 divide-y divide-line border-y border-line",
				children: data.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-sm ${row.voidedAt ? "text-muted line-through" : ""}`,
								children: row.payer
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-sm tabular-nums",
								children: formatMoney(row.amountCents)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [
								row.voidedAt ? "Voided · " : "",
								row.direction === "expenditure" ? "Expenditure" : "Receipt",
								" · ",
								row.method,
								" ",
								row.destination,
								" · ",
								when(row.createdAt)
							]
						}),
						row.missionId && row.missionTitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/missions/$missionId",
								params: { missionId: row.missionId },
								className: "text-accent",
								children: row.missionTitle
							})
						}) : null,
						row.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: row.note
						}) : null,
						row.voidedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [
								"Voided ",
								when(row.voidedAt),
								". The row stays. This is not a refund."
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-2 inline-flex h-11 items-center text-sm text-danger",
							disabled: busy,
							onClick: () => {
								if (voiding !== row.id) {
									setVoiding(row.id);
									return;
								}
								setBusy(true);
								setFormError(null);
								companyCommand({ data: {
									type: "void-payment",
									paymentId: row.id
								} }).then(() => {
									setVoiding(null);
									reload();
								}).catch((err) => setFormError(errorText(err))).finally(() => setBusy(false));
							},
							children: voiding === row.id ? "Confirm void" : "Void this record"
						})
					]
				}, row.id))
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mt-4 text-sm text-danger",
				onClick: reload,
				children: [error, " Retry"]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Parties, {
				parties: data.parties,
				onDone: reload,
				onError: setFormError
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Offers, {
				offers: data.offers,
				onDone: reload,
				onError: setFormError
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayCard, { poster: true })]
	});
}
function Ceiling({ busy, onDone, onError }) {
	const [amount, setAmount] = (0, import_react.useState)("");
	async function save(event) {
		event.preventDefault();
		onError(null);
		try {
			await companyCommand({ data: {
				type: "ceiling",
				amount
			} });
			setAmount("");
			onDone();
		} catch (err) {
			onError(errorText(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: (event) => void save(event),
		className: "mt-4 max-w-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Spending ceiling", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: amount,
					onChange: (event) => setAmount(event.target.value),
					inputMode: "decimal",
					placeholder: "100.00",
					className: `${controlClass} mt-1 h-11`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				variant: "quiet",
				className: "mt-2",
				disabled: busy || dollarsToCents(amount) == null,
				children: "Set ceiling"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Only you can raise or lower this. It does not move money, and it does not change payments already recorded."
			})
		]
	});
}
function DepartmentBudget({ busy, onDone, onError }) {
	const [slug, setSlug] = (0, import_react.useState)(DEPARTMENTS[0]?.slug ?? "engineering");
	const [amount, setAmount] = (0, import_react.useState)("");
	async function save(event) {
		event.preventDefault();
		onError(null);
		try {
			await companyCommand({ data: {
				type: "department-budget",
				note: slug,
				amount
			} });
			setAmount("");
			onDone();
		} catch (err) {
			onError(errorText(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: (event) => void save(event),
		className: "mt-4 max-w-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Department allocation", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: slug,
					onChange: (event) => setSlug(event.target.value),
					className: "mt-1 h-11 w-full rounded-md border border-line bg-bg px-3 text-sm",
					children: DEPARTMENTS.map((department) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: department.slug,
						children: department.name
					}, department.slug))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: amount,
				onChange: (event) => setAmount(event.target.value),
				inputMode: "decimal",
				placeholder: "40.00",
				className: `${controlClass} mt-2 h-11`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				variant: "quiet",
				className: "mt-2",
				disabled: busy || dollarsToCents(amount) == null,
				children: "Set allocation"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Applies when an expenditure names that department. A receipt is not checked against it. A blank department is checked only against the company ceiling and the mission budget."
			})
		]
	});
}
var ROLES = [
	"customer",
	"supplier",
	"employee",
	"contractor"
];
function ExpenditureForm({ missions, onDone, onError }) {
	const [payer, setPayer] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [missionId, setMissionId] = (0, import_react.useState)("");
	const [department, setDepartment] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const cents = dollarsToCents(amount);
	async function submit(event) {
		event.preventDefault();
		setBusy(true);
		onError(null);
		try {
			await companyCommand({ data: {
				type: "record-expenditure",
				payer,
				amount,
				note,
				missionId,
				department
			} });
			setPayer("");
			setAmount("");
			setNote("");
			setMissionId("");
			setDepartment("");
			onDone();
		} catch (err) {
			onError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: (event) => void submit(event),
		className: "mt-8 max-w-xl space-y-3 border-t border-line pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Expenditure"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "This counts against the ceiling. It does not send money."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Who was paid", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: payer,
					onChange: (event) => setPayer(event.target.value),
					className: `${controlClass} mt-1 h-11`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Amount", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: amount,
					onChange: (event) => setAmount(event.target.value),
					inputMode: "decimal",
					placeholder: "25.00",
					className: `${controlClass} mt-1 h-11`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Mission", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: missionId,
					onChange: (event) => setMissionId(event.target.value),
					className: `${controlClass} mt-1 h-11`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Not tied to a mission"
					}), missions.map((mission) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: mission.id,
						children: mission.title
					}, mission.id))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Department", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: department,
					onChange: (event) => setDepartment(event.target.value),
					className: `${controlClass} mt-1 h-11`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Company ceiling only"
					}), DEPARTMENTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: item.slug,
						children: item.name
					}, item.slug))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: ["Note", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: note,
					onChange: (event) => setNote(event.target.value),
					className: `${controlClass} mt-1 h-11`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				disabled: busy || payer.trim().length < 2 || cents == null,
				children: busy ? "Recording…" : cents ? `Record expenditure ${formatMoney(cents)}` : "Record the expenditure"
			})
		]
	});
}
function Parties({ parties, onDone, onError }) {
	const [name, setName] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("person");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function create(event) {
		event.preventDefault();
		setBusy(true);
		onError(null);
		try {
			await companyCommand({ data: {
				type: "create-party",
				name,
				kind
			} });
			setName("");
			onDone();
		} catch (err) {
			onError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10 max-w-xl border-t border-line pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Parties"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "A customer, supplier, employee, or contractor is a role on one party. Archiving keeps the contacts. It does not make a sale."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (event) => void create(event),
				className: "mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (event) => setName(event.target.value),
							className: `${controlClass} mt-1 h-11`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Kind", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: kind,
							onChange: (event) => setKind(event.target.value),
							className: `${controlClass} mt-1 h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "person",
								children: "Person"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "organization",
								children: "Organization"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy || name.trim().length < 2,
						children: "Add party"
					})
				]
			}),
			parties.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted",
				children: "No parties yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 space-y-6",
				children: parties.map((party) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyCard, {
					party,
					busy,
					onDone,
					onError
				}, party.id))
			})
		]
	});
}
function PartyCard({ party, busy, onDone, onError }) {
	const [name, setName] = (0, import_react.useState)(party.displayName);
	const [role, setRole] = (0, import_react.useState)(ROLES[0]);
	const [label, setLabel] = (0, import_react.useState)("");
	const [value, setValue] = (0, import_react.useState)("");
	async function run(data) {
		onError(null);
		try {
			await companyCommand({ data: {
				...data,
				partyId: party.id
			} });
			onDone();
		} catch (err) {
			onError(errorText(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "border-t border-line pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [
					party.displayName,
					" · ",
					party.kind,
					" · ",
					party.status
				]
			}),
			party.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-2 flex gap-2",
				onSubmit: (event) => {
					event.preventDefault();
					run({
						type: "edit-party",
						name
					});
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (event) => setName(event.target.value),
					className: `${controlClass} h-11`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "quiet",
					disabled: busy || name.trim().length < 2,
					children: "Rename"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1 text-sm",
				children: party.roles.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-muted",
					children: "No roles."
				}) : party.roles.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						item.role,
						" · ",
						item.status
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex h-11 items-center text-accent",
						onClick: () => void run({
							type: item.status === "active" ? "deactivate-role" : "reactivate-role",
							role: item.role
						}),
						children: item.status === "active" ? "Deactivate" : "Reactivate"
					})]
				}, item.role))
			}),
			party.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-2 flex gap-2",
				onSubmit: (event) => {
					event.preventDefault();
					run({
						type: "assign-role",
						role
					});
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: role,
					onChange: (event) => setRole(event.target.value),
					className: `${controlClass} h-11`,
					children: ROLES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: item,
						children: item
					}, item))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "quiet",
					children: "Assign"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1 text-sm text-muted",
				children: party.contacts.map((contact) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
					contact.label,
					": ",
					contact.value
				] }, contact.id))
			}),
			party.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-2 space-y-2",
				onSubmit: (event) => {
					event.preventDefault();
					run({
						type: "add-contact",
						label,
						value
					}).then(() => {
						setLabel("");
						setValue("");
					});
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: label,
						onChange: (event) => setLabel(event.target.value),
						placeholder: "Label",
						className: `${controlClass} h-11`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value,
						onChange: (event) => setValue(event.target.value),
						placeholder: "Value",
						className: `${controlClass} h-11`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "quiet",
						disabled: label.trim().length < 2 || value.trim().length < 2,
						children: "Add contact"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 inline-flex h-11 items-center text-sm text-danger",
				onClick: () => void run({ type: "archive-party" }),
				children: "Archive party"
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: "Archived. Contacts stay. This party is not offered for new work."
			})
		]
	});
}
function Offers({ offers, onDone, onError }) {
	const [name, setName] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)("service");
	const [price, setPrice] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function create(event) {
		event.preventDefault();
		setBusy(true);
		onError(null);
		try {
			await companyCommand({ data: {
				type: "create-offer",
				name,
				kind,
				amount: price
			} });
			setName("");
			setPrice("");
			onDone();
		} catch (err) {
			onError(errorText(err));
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10 max-w-xl border-t border-line pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Catalog"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "A price is a recorded amount in cents. Publishing an offer does not charge anyone and does not move stock."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (event) => void create(event),
				className: "mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (event) => setName(event.target.value),
							className: `${controlClass} mt-1 h-11`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Kind", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: kind,
							onChange: (event) => setKind(event.target.value),
							className: `${controlClass} mt-1 h-11`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "service",
								children: "Service"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "product",
								children: "Product"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm",
						children: ["Price", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: price,
							onChange: (event) => setPrice(event.target.value),
							inputMode: "decimal",
							placeholder: "25.00",
							className: `${controlClass} mt-1 h-11`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: busy || name.trim().length < 2 || dollarsToCents(price) == null,
						children: "Publish offer"
					})
				]
			}),
			offers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-muted",
				children: "No offers yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-line border-y border-line",
				children: offers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferRow, {
					offer,
					onDone,
					onError
				}, offer.id))
			})
		]
	});
}
function OfferRow({ offer, onDone, onError }) {
	const [name, setName] = (0, import_react.useState)(offer.name);
	const [price, setPrice] = (0, import_react.useState)((offer.priceCents / 100).toFixed(2));
	async function run(type) {
		onError(null);
		try {
			await companyCommand({ data: {
				type,
				offerId: offer.id,
				name,
				amount: price
			} });
			onDone();
		} catch (err) {
			onError(errorText(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "py-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			offer.name,
			" · ",
			offer.kind,
			" · ",
			offer.status,
			" · ",
			formatMoney(offer.priceCents)
		] }), offer.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-2 space-y-2",
			onSubmit: (event) => {
				event.preventDefault();
				run("edit-offer");
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (event) => setName(event.target.value),
					className: `${controlClass} h-11`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: price,
					onChange: (event) => setPrice(event.target.value),
					inputMode: "decimal",
					className: `${controlClass} h-11`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "quiet",
						disabled: name.trim().length < 2 || dollarsToCents(price) == null,
						children: "Save price"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex h-11 items-center text-danger",
						onClick: () => void run("retire-offer"),
						children: "Retire"
					})]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted",
			children: "Retired. It cannot be added to a new order."
		})]
	});
}
//#endregion
export { PaymentsPage as component };
