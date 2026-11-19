# NEXUS business backlog

This is the architecture and build order for the product in [nexus-product-definition.md](nexus-product-definition.md). A milestone is not done unless it still satisfies every invariant in that definition.

Status values: Not started, Designed, Implemented, Tested. Nothing here is verified in production.

A row is not done because a table or screen exists. It is done when the workflow runs, permission is enforced, failure is recoverable, and a test covers that behavior.

## Current foundation

| Capability | Status | Evidence | Do not rebuild |
| --- | --- | --- | --- |
| One organization per signed-in owner | Implemented | `organizations`, `ensureCompany` | Do not add a second company table |
| Sign-in session | Implemented | `user`, `session`, `account` | Do not replace Better Auth to add roles |
| Eight-agent workforce | Tested | CEO, COO, Researcher, Product Manager, Systems Architect, Developer, Designer, QA Engineer | Do not rename or duplicate departments |
| Mission lifecycle, assignments, handoffs, dependencies, priority | Tested | `missions`, `assignments`, `handoffs` | This is the only execution lifecycle |
| Owner authorize and accept; agents cannot do either | Tested | mission transitions and acceptance checks | Do not move acceptance into the model |
| Independent QA bound to an artifact hash | Tested | `qa_reports`, sandbox | A new report must not cover a changed artifact |
| Leases, fencing, scheduler run/pause/stop, dead letter | Tested | `execution_jobs`, `scheduler_state` | Pause and stop do not drain or start work |
| Outbox delivery receipt | Tested | `outbox_events`, `outbox_deliveries` | Delivery does not authorize, accept, or move money |
| Spending ceiling, commitments, payment records | Tested | `payments.direction` separates receipts from expenditures. Receipts do not consume a ceiling. | Not a general ledger and not a bank transfer |
| Specification versions and requirement links | Tested | `specifications`, `requirements` | Do not overwrite an accepted version |
| Integration registry, sealed secrets, GitHub read-only | Tested | `integrations`, `integration_secrets`, `github_*` | GitHub is not authenticated. Writes stay refused |
| Cross-organization lease denial | Tested | lease test with `org_a` and `org_b` | Not a multi-business product |
| Projects, tasks, task runs, approvals | Implemented | `0002_nexus.sql` | Not connected to missions. Do not sync them silently |
| Customers, catalog, orders, invoices, journal, employees, suppliers, tickets | Partial | Parties, offers, quotes, orders, invoices, and the claim journal are tested. Support tickets are not. | Build them on the objects below |

`npm test` runs the NEXUS suite, the app suite, and the workspace suite, and exits non-zero if any of them fail. On this tree it exits 0. `npm run build` exits 0. That build is not a deployment. A missing auth flag still means sign-in is on. The share title for this workspace is `ADL NEXUS`.

## Decisions that the later milestones assume

1. Missions are the authoritative execution lifecycle. Projects and tasks stay as historical records until an owner links a task to a mission. No automatic synchronization.
2. A person or company outside the workforce is a Party. Customer, supplier, and employee are roles on a party, not three identity systems.
3. Money the company believes it is owed is an Invoice. Money the owner records is the existing payment ledger. A journal entry is posted only from those two records. A row is not proof that a bank moved funds.
4. Every new table includes `organization_id` and is denied across organizations by the same query predicate already used for missions.
5. Every external call goes through the existing integration gate. Read is the default. A write requires an owner grant for that scope. Failure to seal a credential fails closed.
6. Modules that a business type does not use stay off. The tables may exist. The scheduler must not create work for a disabled module.

## Milestones

### M0 — Verification closure

Status: Tested on this tree. Not a deployment.

Depends on: nothing.

Database: none.

Tasks:

- Make `npm test` report NEXUS failures and workspace failures without hiding either.
- Decide the two stale expectations in code, not by skipping them: this app treats a missing auth flag as sign-in on; the share title is `ADL NEXUS`.
- Run the production build. Record the result. Do not call that a deployment.

Acceptance:

- `npm test` exits 0, or the remaining failures are listed as environment failures with the command that produced them.
- `npm run build` exits 0 on this tree.
- No mission, payment, or auth rule changes.

### M1 — One work lifecycle

Status: Tested. A task link does not start or move either record.

Depends on: M0.

Database: `mission_links(organization_id, mission_id, task_id, linked_by, created_at)` with a unique pair. No columns added to rewrite project state.

Tasks:

- Owner can link an existing task to an existing mission in the same organization.
- Owner can unlink it. Unlink does not delete the task or the mission.
- Scheduler, QA, and acceptance read missions only.
- A task moving state does not move the mission. A mission moving state does not move the task.

Acceptance:

- A link across organizations is rejected.
- An agent cannot create the link.
- Unlinked projects still load.
- Existing mission tests still pass.

### M2 — Prove isolation before new business objects

Status: Tested. Two owners still get two companies. There is no company switcher.

Depends on: M0. Can run beside M1.

Database: none.

Tasks:

- Add a test that creates two organizations and shows missions, payments, secrets, and outbox rows do not cross.
- Document that the product still creates one organization per owner. Do not add a switcher in this milestone.

Acceptance:

- A query for organization A returns no row owned by organization B for missions, payments, integration secrets, and outbox events.
- Existing lease isolation test still passes.

### M3 — Party

Status: Tested on this tree. Archive keeps contacts. An inactive role must be reactivated. A role cannot point at another company's party.

Depends on: M2.

Database:

- `parties(id, organization_id, kind, display_name, status, created_at)`
- `party_roles(id, organization_id, party_id, role, status)` where role is `customer`, `supplier`, or `employee`
- `party_contacts(id, organization_id, party_id, label, value, created_at)`

Tasks:

- Owner creates, edits, and archives a party.
- A role can be added or removed without deleting the party.
- Archived parties do not appear in pickers. Their history remains.
- No sale, invoice, or payroll behavior.

Acceptance:

- Party and contact reads are organization-scoped.
- An agent cannot create a party.
- Archive does not delete contacts.

### M4 — Catalog

Status: Tested on this tree. A price is integer cents and is not a charge.

Depends on: M3.

Database: `offers(id, organization_id, kind, name, status, price_cents, currency, created_at)`. `kind` is `product` or `service`. Price is a recorded amount, not a charge.

Tasks:

- Owner creates, edits, and retires an offer.
- Retired offers cannot be added to a new order.
- No inventory movement.

Acceptance:

- A second organization cannot read the offer.
- Price is integer cents or the write is rejected.
- An agent cannot publish an offer.

### Business operating record

Status: Tested on this tree. Not a law firm, a bank, or a second company.

Depends on: parties, offers, and the payment ledger.

Database: `ventures`, `obligations`, `filings`, `instruments`, `capital_items`, `invoices`, `invoice_allocations`, `product_briefs`, `campaigns`, `market_notes`, `procedures`, `positions`, `engagements`, `stock_counts`.

What it does:

- One business record per company. Opening it creates obligations across formation, governance, finance, product, market, operations, people, and launch authority.
- Research obligations can be prepared and staffed as a proposed mission. The mission is not authorized to execute.
- Restricted obligations cannot open a mission. The owner records that a person acted outside NEXUS.
- Launch readiness stays closed until a person records launch authorization on `launch_authorizations`. A waiver, a fulfilled obligation, and a finished mission do not open it. Operating stays closed until readiness is recorded. An outside action is stored on `external_action_records` and is not a verification.
- Invoices are claims. A receivable allocates only a receipt. A payable allocates only an expenditure. Issuing an invoice creates no payment.
- Capital and campaign budgets are plans. Marking funding received, or authorizing a campaign, does not write a payment.
- A procedure is an executable definition: owner, trigger, inputs, actions, outputs, exceptions, verification. Running it opens a proposed mission.
- Positions are employees or contractors, engaged only when the party has that role. Agents cannot hold one.
- Stock is a count the owner writes. A sale does not change it.
- The recorded margin is receipts minus expenditures. It is not a bank balance.

What it does not do: legal advice, government submission, trademark registration, tax filing, banking, payroll calculation, ad publication, or live payment processing.

Acceptance:

- An agent cannot open the record, staff work, allocate money, or engage a person.
- Another company cannot read or attach the record.
- A restricted obligation does not create a mission or a filing.

### M5 — Quote and order

Status: Tested on this tree. Acceptance creates an order. It does not take payment and it does not authorize a mission.

Depends on: M1, M4.

Database:

- `quotes(id, organization_id, party_id, status, currency, created_at)`
- `quote_lines(id, organization_id, quote_id, offer_id, quantity, amount_cents)`
- `orders(id, organization_id, party_id, quote_id, status, currency, created_at)`
- `order_lines` with the same shape as quote lines
- `order_mission_links(organization_id, order_id, mission_id, linked_by)`

Statuses: quote `draft` or `issued`. Order `draft`, `accepted`, `cancelled`, `fulfilled`. Owner acceptance is the only path into `accepted`.

Tasks:

- Owner issues a quote to a party whose role is customer.
- Owner accepts the quote into an order. An agent cannot.
- Owner may link the order to a mission. The link does not authorize the mission.
- Cancel is owner-only and does not delete lines.

Acceptance:

- A party without the customer role cannot receive a quote.
- A retired offer cannot be added.
- Cross-organization party, offer, or mission is rejected.
- Cancelling an order does not cancel a mission.

### M6 — Invoice against the existing ledger

Status: Tested on this tree. One number sequence per company, shared by manual issue and order issue. One open invoice per order. Void keeps the invoice, the allocation, and the payment. A voided invoice no longer consumes the receipt. No processor.

Depends on: M5.

Database:

- `invoices(id, organization_id, order_id, party_id, number, status, currency, issued_at)`
- `invoice_lines(id, organization_id, invoice_id, description, amount_cents)`
- `invoice_allocations(id, organization_id, invoice_id, payment_id, amount_cents)`

Invoice status: `draft`, `issued`, `void`. Numbers are unique per organization.

Tasks:

- Owner issues an invoice from an accepted order. The sum of lines is the total.
- A recorded payment in the existing `payments` table can be allocated. Allocation cannot exceed the payment or the invoice.
- Void keeps the row and removes it from what is still owed. Void does not delete the payment.
- No processor call.

Acceptance:

- Two allocations cannot over-apply one payment.
- An agent cannot issue or void.
- A payment in another organization cannot be allocated.
- The spending ceiling is unchanged by an invoice.

### M7 — Journal posted only from known records

Status: Tested on this tree. Not a bank ledger and not a second set of books.

Depends on: M6.

Chart, per company. These names are claims, not cash:

| Code | Name | Kind | Normal |
| --- | --- | --- | --- |
| 1200 | Claims receivable | asset | debit |
| 1300 | Receipts applied | asset | debit |
| 2100 | Claims payable | liability | credit |
| 4100 | Claims recorded | income | credit |
| 5100 | Obligations recorded | expense | debit |
| 5300 | Expenditures applied | expense | debit |

Posting rules:

- Issue a receivable: debit 1200, credit 4100. This records a claim. It does not collect cash.
- Issue a payable: debit 5100, credit 2100. This records an obligation. It does not spend.
- Allocate a receipt: debit 1300, credit 1200. This applies a payment-ledger receipt. It does not create one.
- Allocate an expenditure: debit 2100, credit 5300. This applies a payment-ledger expenditure. It does not create one.
- Void a receivable of T with A already allocated and O still open: debit 4100 for T, credit 1200 for O, credit 1300 for A. A zero side is omitted.
- Void a payable: debit 2100 for O, debit 5300 for A, credit 5100 for T.
- A draft void posts nothing. A number is assigned only at issue and is never reused.

Database: `ledger_accounts`, `journal_entries`, `journal_lines`. One entry per organization, source type, and source id. Source types are `invoice.issued`, `invoice.allocated`, and `invoice.void`.

The recorded margin still comes from receipts minus expenditures. Posted claim balances come from the journal. If an issued invoice has no posting, that posted figure is unavailable. It is not shown as zero.

What it does not do: client-entered journal lines, edits to a posted row, cash accounting, or a bank balance.

Acceptance:

- Every entry balances.
- Re-running the post for the same source does not create a second entry.
- An agent cannot post.
- A manual journal line from the client is rejected.
- A failed post rolls back the invoice change in the same transaction.
- Posted rows cannot be updated or deleted.
- Voiding does not delete the payment or the allocation.

### M8 — Support

Depends on: M3.

Database: `tickets(id, organization_id, party_id, mission_id, status, title, created_at)`, `ticket_notes(id, organization_id, ticket_id, author_id, body, created_at)`.

Tasks:

- Owner opens a ticket for a customer party and may link a mission.
- Status is `open`, `waiting`, `closed`. Close does not delete notes.
- No inbound mailbox.

Acceptance:

- Cross-organization party or mission is rejected.
- An agent cannot close a ticket unless the owner has assigned that ticket. Assignment is an explicit owner action.

### M9 — People

Depends on: M3.

Database: `engagements(id, organization_id, party_id, kind, status, started_on, ended_on)`. `kind` is `employee` or `contractor`.

Tasks:

- Owner records an engagement for a party with the employee or contractor role.
- Ending an engagement archives access only if that person has a login. Do not invent a login.
- No payroll calculation and no payment execution.

Acceptance:

- A customer role alone cannot have an engagement.
- Ending an engagement does not delete the party or the payment history.

### M10 — Supplier purchase

Depends on: M4, M7.

Database: `purchase_orders(id, organization_id, party_id, status, currency, created_at)`, `purchase_lines`, and a supplier invoice that posts through M7.

Tasks:

- Owner issues a purchase order to a supplier party.
- A supplier invoice posts a balanced journal entry and a commitment against the existing ceiling. The ceiling check is the existing one.
- No bank payment.

Acceptance:

- A party without the supplier role is rejected.
- A post that would break the ceiling is rolled back, including its journal entry.
- An agent cannot approve the purchase.

### M11 — One connector, still on the current gate

Depends on: M2. Later connectors wait until this one has passed.

Database: rows in the existing `integrations` and `integration_secrets` tables. No new secret store.

Tasks:

- Pick one read-only connector that is not GitHub. Mail or calendar metadata is enough.
- Use the existing scope check, seal, audit, timeout, and revocation.
- A write method exists only to return a refusal before any network call.

Acceptance:

- Missing encryption key fails closed.
- A revoked credential is not sent.
- A write attempt does not call the network.
- The connection screen shows not connected until a live read succeeds.
- GitHub behavior is unchanged.

### M12 — Scheduler isolation

Depends on: M2.

Database: none if `scheduler_state` is already one row per organization.

Tasks:

- Confirm each organization has its own scheduler row.
- A running scheduler in A does not claim work in B.
- Pause in A does not pause B.

Acceptance:

- Two organizations, one running and one stopped, produce one start and zero starts respectively.
- Outbox drain follows the same rule.

### M13 — Figures that name their source

Depends on: M6. Journal figures wait for M7.

Database: extend `metric_snapshots` rather than adding a second metrics table. Each row needs source, period, and `observed` or `forecast`.

Tasks:

- Operations shows invoice totals and open tickets only when those modules have rows.
- A forecast is labeled forecast. An empty module is labeled unavailable, not zero.

Acceptance:

- A snapshot cannot be saved without a source and a period.
- Recommendations remain text. They do not issue invoices, move missions, or change ceilings.

### M14 — Legal records as documents

Depends on: M3.

Database: `records(id, organization_id, party_id, kind, title, body, created_at)`. `kind` includes `registration`, `license`, `policy`.

Tasks:

- Owner stores and archives a record.
- The screen does not say the business is compliant.

Acceptance:

- An agent cannot create a legal record.
- Archive keeps the text.

### M15 — Optional stock

Depends on: M5. Off unless the owner enables it for that organization.

Database: `stock_items(id, organization_id, offer_id, on_hand)`, `stock_moves(id, organization_id, item_id, order_id, delta, created_at)`.

Tasks:

- Accepting an order does not move stock until the module is on and the owner posts a move.
- On-hand cannot go negative.

Acceptance:

- With the module off, order acceptance writes no stock row.
- A negative move is rejected.
- Another organization's offer cannot be stocked.

### M16 — Campaigns as records

Depends on: M3, M13.

Database: `campaigns(id, organization_id, name, status, budget_cents, created_at)`.

Tasks:

- Owner records a campaign and a budget figure. The figure is not a spend and does not reserve the ceiling until the owner posts a commitment through the existing commitment path.
- No ad network calls.

Acceptance:

- A campaign budget is not counted as spent.
- An agent cannot publish a campaign.

### M17 — Host controls that the app must not fake

Depends on: M0.

Not application tables:

- Multi-factor authentication.
- Distributed rate limiting.
- Backup and a tested restore.
- CI on a real staging environment.
- Production monitoring.

Acceptance is a written result from the host, not a green badge in the product. Until that result exists, the status stays Not started.

## Final acceptance, only after M0–M14

M15 and M16 may stay off.

- Three organizations exist through a product path, not a test insert.
- Each has its own owner, parties, offers, orders, invoices, and missions.
- Missions can run at the same time. QA and acceptance stay inside the organization.
- A payment allocated in one organization is invisible in the others.
- Secrets and scheduler state do not cross.
- Suspending one organization stops its scheduler and rejects its writes. The other two keep running.
- Restoring it returns the same rows. This restore is a tested host backup, not a status flag, until M17 is done.
- No agent has authorized a mission, accepted a packet, issued an invoice, or approved a purchase.

## Mapping

| Checklist section | Milestone |
| --- | --- |
| 1 Platform foundation | M0, M17 |
| 2 Multi-business | M2, M12, final acceptance |
| 3 Identity and authority | M2, M9, M17 |
| 4 AI workforce | already tested; M1 and M12 keep it |
| 5 Work and execution | M1 plus the existing mission tests |
| 6 CRM | M3, M8 |
| 7 Products | M4, M15 |
| 8 Sales | M5 |
| 9 Orders | M5, M15 |
| 10 Accounting | M6, M7 |
| 11 Banking | M11, and only after a processor grant exists |
| 12 HR | M9 |
| 13 Procurement | M10 |
| 14 Inventory | M15 |
| 15 Marketing | M16 |
| 16 Support | M8 |
| 17 Legal | M14 |
| 18 Integrations | existing gate, M11 |
| 19 Intelligence | M13 |
| 20 Scheduling | existing scheduler, M12 |
| 21 Security | existing sandbox and org scope, M17 |
| 22 Interface | built inside each milestone, not as a separate shell |
| 23 Tests | the acceptance block on each milestone |
| 24 Three-business test | final acceptance |
