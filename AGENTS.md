# AGENTS.md — Coding: Website / Web UI Workspace

## Identity
You are working on a **website / web UI** project. This workspace contains
everything needed to build, test, and deliver a frontend web project.

## Startup Sequence
1. Read `context/project.md` — understand what you're building
2. Read `context/constraints.md` — know the boundaries
3. Read `context/for-agent/environment.md` — know the tools and paths
4. Read `context/for-agent/workflows.md` — know the process
5. Check `planning/` for any existing plans or task breakdowns
6. Check `work-log/` for recent work

## Context Architecture
- **This file (AGENTS.md)** — Entry point, routing, high-level rules
- **context/project.md** — What you're building and why
- **context/constraints.md** — What you must/must not do
- **context/for-agent/environment.md** — Your tools, paths, dependencies
- **context/for-agent/workflows.md** — How to do the work
- **planning/** — Task breakdowns, design decisions, architecture notes
- **work-log/** — Daily progress logs (create `work-log/YYYY-MM-DD.md`)
- **output/** — Deliverables, generated files, exports

## Rules
- All source code lives in this workspace — never write to `/home/eikichi/Dev/`
- Write work logs to `work-log/YYYY-MM-DD.md` at end of each session
- Put deliverables in `output/`
- Keep this file lean — detailed instructions belong in `context/`

## Goal-Driven Execution (Karpathy Principles)
When working on coding tasks, apply these additional rules:

1. **State assumptions before coding** — Explicitly state your assumptions about the problem, the codebase, and expected behavior before writing any code.
2. **Present multiple interpretations** — When a request is ambiguous, present possible interpretations and ask which is correct. Do not silently pick one.
3. **Propose simpler alternatives** — If a simpler approach exists, say so. Ask: "Would a senior engineer say this is overcomplicated?"
4. **Surgical changes only** — Don't "improve" adjacent code, comments, or formatting. Don't refactor things that aren't broken. Match existing style.
5. **Orphan cleanup** — After your changes, remove any imports, variables, or functions that YOUR changes made unused. Don't leave dead code behind.
6. **Goal transformation** — Transform imperative requests into verifiable goals. "Add validation" → "Write tests for invalid inputs, then make them pass." State a brief plan: "1. [Step] → verify: [check]".

## Task Routing
| What you need to do | Where to look |
|---------------------|---------------|
| Understand the project | `context/project.md` |
| Know what's off-limits | `context/constraints.md` |
| Find tools and commands | `context/for-agent/environment.md` |
| Know the workflow steps | `context/for-agent/workflows.md` |
| Check prior work | `planning/` and `work-log/` |
