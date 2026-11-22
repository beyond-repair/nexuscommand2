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
| Customers, catalog, orders, invoices, journal, employees, suppliers, tickets | Partial | Parties, offers, quotes, orders, invoices, the business record, and the control loop are tested. A general journal is not. | Build them on the objects below |

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

Status: Tested on this tree for an order invoiced onto the existing `invoices` table. No second invoice system. No processor. The journal is M7 and is not started.

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

Depends on: M6.

Database:

- `ledger_accounts(id, organization_id, code, name, kind)`
- `journal_entries(id, organization_id, source_type, source_id, posted_at)`
- `journal_lines(id, organization_id, entry_id, account_id, debit_cents, credit_cents)`

Tasks:

- Issuing an invoice posts a balanced entry. Allocating a payment posts a balanced reversing-or-settlement entry. Void posts a reversal. No other writer creates lines.
- Statements read the journal. If a source is missing, the statement says the figure is unavailable. It does not show zero.

Acceptance:

- Every entry balances.
- Re-running the post for the same source does not create a second entry.
- An agent cannot post.
- A manual journal line from the client is rejected.


### Organizational control loop

Status: Tested on this tree. Not a second mission lifecycle, and not unsupervised execution.

Depends on: M1, M5, M6.

Database: `control_policies`, `control_cycles`, `control_events`, `control_decisions`. One policy row per company for `work.propose`. Levels are 0 manual, 1 assisted, and 2 delegated. The default is assisted. A stop flag is separate from the level. Events and decisions cannot be updated or deleted.

What a cycle does:

- Reads open obligations with no mission, accepted orders with no mission link, and issued invoices that are not fully allocated.
- Writes one immutable event per idempotency key. A second cycle does not decide that event again.
- Assisted and manual leave a notice. Delegated calls the existing staffing path, which opens a `PROPOSED` mission. That mission is not authorized.
- Restricted obligations, unlinked orders, and open claims are notices at every level, including delegated.
- A notice taken while assisted does not block a later delegation. Delegation uses its own key and can still propose.
- Stop records notices and opens nothing, even at delegated. Resume does not authorize the missions it later proposes.
- Opening the command page does not run a cycle.

What it does not do: levels 3 or 4, learning, a knowledge graph, a second workflow engine, filing, payments, bank movement, publication, contract signing, payroll, or a change to security permissions. The existing scheduler pause and stop are unchanged.

Acceptance:

- An agent cannot run the loop or change its policy.
- A non-owner cannot run it.
- Assisted and manual cycles create no missions.
- A restricted obligation never receives a mission.
- Delegated missions stay `PROPOSED`. The ceiling, payments, order links, and invoice count do not change.
- A second cycle does not add a duplicate decision or mission.
- Another company cannot see the events or decisions.
- Control events and decisions cannot be updated or deleted.

### Dependency awareness

Status: Tested on this tree. Not execution authority.

Depends on: the organizational control loop.

Database: `organizational_relationships`, `dependency_findings`. A relationship is `depends_on`, `blocks`, `requires_approval`, `owned_by`, `assigned_to`, `produces`, `satisfies`, `derived_from`, or `related_to`. Both records must already belong to the same company. An active duplicate is rejected. A record cannot relate to itself. Retirement keeps the row. Deleting a relationship or a finding is rejected.

Blocking edges are `depends_on` and `blocks`. Completion is the stored state: an obligation is complete only when satisfied or waived, a mission only when accepted, a task only when completed, an order only when fulfilled, and an issued invoice only when nothing remains open. A proposed mission is not complete. There is no reliable deadline column, so nothing is marked overdue.

A cycle reads that graph. Blocked, missing, circular, and approval-waiting research is not proposed. Delegated mode may still open a proposed mission for research that is free to start. The mission is not authorized. Restricted work stays out. Opening the page computes the reading and does not write findings. A cycle writes findings. A cleared finding is retired, not deleted.

What it does not do: schedule itself, authorize launch, move money, accept an order, issue an invoice, or let an agent add or retire a relationship. A completed middle record does not hide an open prerequisite further along the chain.

### Priority

Status: Tested on this tree. Decision support, not execution authority.

Depends on: the control loop and dependency awareness.

Database: `priority_policies`, `priority_objectives`, `priority_evaluations`, `priority_changes`. Policy version 1 is the only defined scoring rule. An owner may record a critical, high, low, or defer objective with a reason. Retirement keeps the row. Deleting priority history is rejected.

Scoring uses only recorded evidence. A downstream unfinished record is 2 points, capped at 3 records. A recorded customer commitment is 6. An open claim is 2 and is not cash. A documented open obligation is 1. An owner mark of high adds 3. Low subtracts 2. Defer applies only when no customer commitment is recorded. Unknown factors, including deadlines and cash, add nothing. P0 exists only when an owner records a critical objective and a reason. The engine does not invent urgency.

A recommendation is do now, do next, prepare, await human approval, resolve blocker, assign ownership, or defer. Blocked, missing, circular, and approval-waiting work is not recommended as ready. The sequence places an unfinished prerequisite ahead of a higher class. Restricted work stays with a person. Opening the page computes the reading and does not write evaluations. A cycle writes evaluations and priority changes. An unchanged reading does not add another change.

What it does not do: authorize a mission, clear a dependency, grant approval, reclassify restricted work, authorize launch, move money, issue an invoice, accept an order, or let an agent change the policy or an objective.

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
