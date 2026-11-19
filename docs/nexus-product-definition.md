# NEXUS product definition

This is the target. It is not a claim about what the repository currently does.

| Layer | Meaning |
| --- | --- |
| Product definition | What finished NEXUS must do. This document. |
| Architecture | How components enforce those behaviors. [nexus-business-backlog.md](nexus-business-backlog.md). |
| Implementation | What exists in the repository. |
| Verification | What tests and operational evidence prove. |
| Deployment | What has been demonstrated in a live environment. |

A feature is not complete because a table, screen, or agent exists. The completion criterion is operational proof: several independent businesses can run authorized work at the same time, survive failures, keep financial and organizational integrity, and remain under owner control.

## Product

NEXUS is a governed, multi-business AI operating company. It takes objectives, staffs them with specialized agents, executes authorized work, verifies exact deliverables, preserves institutional knowledge, and manages the commercial and operational systems surrounding that work.

Six capabilities are inseparable. Removing one of them means the product is not NEXUS.

**Execution.** Objective, then authorization, then research, specification, architecture, design, implementation, isolated QA, and owner acceptance.

**Orchestration.** Concurrent missions, dependencies, priorities, milestones, leases, retries, dead letters, and a scheduler controlled separately for each business.

**Institutional memory.** Versioned specifications, change-impact tracking, contested knowledge, artifact-bound evidence, and a durable audit history.

**Operational observability.** Scheduler health, sandbox enforcement, queue age, provider outcomes, maintenance findings, and metrics that name their evidence.

**Controlled external access.** Scoped connectors, credential isolation, read and write authorization, device controls, emergency stops, and disclosure boundaries.

**Business operations.** Parties, catalog, sales, orders, invoicing, payment allocation, accounting journals, procurement, support, workforce engagements, campaigns, legal records, and optional inventory.

## Invariants

These are the acceptance principles for every milestone. A milestone that weakens one of them is not done.

| Invariant | Required behavior |
| --- | --- |
| Human authority | Agents cannot authorize their own work or expand their authority. |
| Artifact integrity | QA results apply to the exact tested artifact. |
| Organization isolation | Businesses cannot access one another's data, queues, or credentials. |
| Execution integrity | Expired workers cannot write after losing their lease. |
| Financial integrity | Records do not imply money moved. |
| External safety | Unauthorized writes are rejected before network execution. |
| Evidence integrity | Delivery, testing, and acceptance remain distinct events. |
| Operational integrity | Disabled modules create no work. |
| Confidentiality | Private work cannot reach unauthorized public models. |
| Recovery | Crashes do not erase authoritative state or institutional memory. |

## Sequence

M0 through M17 in the backlog remain the build order. M0, M1, and M2 are tested on this tree and are not a deployment. Parties, offers, the business operating record, quotes, orders, and invoices against that record are tested on this tree. They coordinate one company. They do not file, bank, publish, or bind it. A quote is not an order. An order is not a payment or a mission authorization. An invoice is not a receipt and does not consume a spending ceiling. The journal is not started.

The workforce that already runs inside one organization is part of this definition. It is not a prototype to be replaced by the business modules.
