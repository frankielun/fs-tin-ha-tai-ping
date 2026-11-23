# Product memory — Tin Ha Tai Ping

> Owned by fs-memory. Entries carry provenance and are invalidated when
> superseded. Verify before trusting.

## Decisions

- **2026-11-24 · Model routing (per fs-ai-expert references/model-routing.md,
  user-confirmed)** — Tiered routing for Paseo dispatch:
  - **Gates** (fs-architect sign-off/ADR, fs-lead feasibility verdicts):
    `opencode-go/gpt-5.6-luna`, thinking `high`. The one place never to
    save. Empirical record: 4 gate-grade dispatches, all graded PASS.
  - **Dev bench tickets** (fs-rn-dev / fs-ios-dev / fs-android-dev work):
    `opencode-go/kimi-k3.1-pro`, thinking `low` (fast mid tier).
  - **Escalation**: on the second failure of the same ticket, escalate one
    thinking tier, then to Luna-high; always attach the failure context
    (fs-pm followup-loop already does this).
  - Prior switch: `opencode/claude-opus-5-5` was tried first but model
    access was disabled → user directed to opencode-go models.
