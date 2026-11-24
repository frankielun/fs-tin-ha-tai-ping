# Tin Ha Tai Ping (天下太平)

A game project, built with the **fs-agentic-flow** agentic software team
(PM, architect, designer, bench devs, QA, DevOps — as skills).

## Agentic team setup

The team is consumed as an APM dependency (Agent Package Manager CLI) —
skills are **declared, never vendored** into this repo:

- `apm.yml` — manifest, declaring the dependencies (`mattpocock/skills`,
  `../fs-agentic-flow`).
- `apm.lock.yaml` — resolved dependency lock.
- Everything else (`AGENTS.md`, `.agents/`, `.claude/`, `.codex/`, …) is
  **build output**, regenerated locally by `apm install` + `apm compile`,
  and gitignored.

### Requirements

- APM CLI (Agent Package Manager)
- A checkout of the private `fs-agentic-flow` repo as a **sibling directory**
  (`../fs-agentic-flow`)

### Install / refresh the team

```bash
apm install   # deploy skills + MCP configs (argent, playwright, github, penpot)
apm compile   # regenerate AGENTS.md / CLAUDE.md
```

`apm lifecycle trust` was run once to enable the post-install `fs-doctor`
health check (verifies MCP servers, plugins, and local services).

## Workflow

Bring any idea, feature, or bug to **fs-pm** — it grills, writes specs and
tickets (under `.scratch/<feature-slug>/`), routes work to specialists, and
follows up until done. Builds never start without **fs-architect** sign-off.
Experience is captured in `memory/` by **fs-memory**.

## Run the game

The root is an Expo SDK 54 app (New Architecture, portrait-only) with the
rules engine and AI in `src/engine` and `src/ai`.

```bash
corepack pnpm install
./node_modules/.bin/expo run:ios
./node_modules/.bin/expo run:android
```

Normal launches open a real Easy vs-AI match with **包 / 剪 / 揼** input and
animated 3D hands. The ticket-04 deterministic battlefield remains available to
QA through `BattlefieldApp debug`; its headless replay is:

```bash
./node_modules/.bin/tsx scripts/app-replay.ts
```

Static checks and native bundle checks:

```bash
./node_modules/.bin/vitest run
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/expo export --platform ios
./node_modules/.bin/expo export --platform android
```

The native `ios/` and `android/` source projects are tracked; build outputs are
ignored. See `memory/app-map.md` for the snapshot/scene boundaries.
