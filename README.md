# Ymir workflow dashboard

A demo dashboard for the Ymir package maintenance pipeline described in the
[`ai-workflows`](./ai-workflows) repository. It uses the supplied
workflow image as a graph outline and displays synthetic issue progress; it
does not connect to Jira, Redis, GitLab, or the Ymir API.

## Run locally

```sh
pnpm install
pnpm dev
```

Create a production bundle with `pnpm build`, or inspect one with
`pnpm preview` after building.

## Demo behavior

The dashboard starts a deterministic sequence automatically. It moves mock
issues through triage, backport/rebase/rebuild, build validation, optional MR
consolidation, QE and release checks, and closeout. Recoverable build failures
use the retry path; issues that need maintainer input use the attention path.
Pause and replay controls are available above the graph. Issue keys use the
`DEMO-` prefix so they are not mistaken for Jira records.

The graph combines packaging and post-merge release stages into one overview.
In Ymir, preliminary testing, issue verification, and errata handling are
separate workflows; consolidation is conditional on package/branch eligibility.
The dashboard's typed `WorkflowDataSource` interface is the boundary for a
future live data adapter.
