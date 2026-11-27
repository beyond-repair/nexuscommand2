# nexuscommand2

**Lifecycle:** RESEARCH  
**Claim Level:** ≤1  
**Governing source:** [ADL-Governance](https://github.com/beyond-repair/ADL-Governance)

Experimental JavaScript / TypeScript application (TanStack Start + Vite + React 19) serving as an App Builder Workspace sandbox for local-first development previews. Includes local persistent data via PGlite (`.data/nexus-pglite`).

## Status

- No production claims supported.
- Local runnable experimental demo.
- Tests present (`npm test`, `npm run test:nexus`, etc.).
- No CI workflows currently configured.
- Large `.data/` directory is committed (historical PGlite state) — not recommended for long-term; operator cleanup optional.
- Open Dependabot alerts (medium/low: minimatch, better-auth family) — non-critical for experimental workspace; operator review recommended.

## Not Claimed

Production deployment, autonomous spend, validated economic outcomes, AGI, live multi-agent company operation.

## Development

```bash
npm install
npm run dev   # listens on 0.0.0.0:8080
npm test
npm run typecheck
npm run build
```

See `AGENTS.md` for the full sandbox contract and skill routing.

---

**REWRITE · BUILD · TRANSCEND**
