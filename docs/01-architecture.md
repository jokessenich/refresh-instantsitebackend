# Part 1 — Architecture Overview

## Why Option B (Structured Content + Templates) is the Right V1 Choice

### The Decision

Claude returns **structured JSON content/config**, and the backend renders that into
**fixed, pre-validated templates**. Claude never generates raw code files.

### Why This is Better for V1

1. **More Reliable** — Claude returns a bounded JSON object with known keys. If a field
   is missing or malformed, validation catches it before any deployment attempt. With raw
   code generation, a single misplaced bracket breaks the entire site silently.

2. **Easier to Validate** — We define a Zod schema for Claude's output. Every field is
   type-checked, length-bounded, and sanitized. Validating arbitrary code for correctness,
   security, and visual quality is an unsolved problem.

3. **More Deterministic** — The same brief always maps to the same template structure.
   Only the text content varies. This means consistent quality across generations — no
   "sometimes it looks great, sometimes it's broken."

4. **Easier to Maintain** — Template bugs are fixed once and apply to all future sites.
   With raw generation, every site is a unique snowflake. Template improvements instantly
   upgrade the quality floor for every new site.

5. **Lower Support Burden** — When a customer reports a visual issue, we know exactly
   which template version they're on. We can reproduce it deterministically. With raw
   generation, debugging requires understanding a unique codebase for every customer.

### Architecture Flow

```
[User Brief] → [Validate + Store] → [Select Template]
                                           ↓
                              [Build Claude Prompt]
                                           ↓
                              [Claude Returns JSON]
                                           ↓
                              [Validate JSON Schema]
                                           ↓
                         [Assemble Files from Template]
                                           ↓
                          [Deploy to Vercel via API]
                                           ↓
                            [Return Preview URL]
```

### Key Architectural Decisions

- **One deployment per generated site** — no in-place updates in V1
- **Preview deployments only** — no production promotion yet
- **No GitHub in the path** — Vercel REST API file upload only
- **Constrained verticals** — 6 business types, each with a tuned template
- **No revisions** — generate once, deploy once, get a URL
- **Stateless file assembly** — site files built in memory, never written to disk
