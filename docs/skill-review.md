# UI UX Pro Max: scoped review

Reviewed 2026-10-12, source https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Pinned source commit: `67803eac81607188194aea9842a723b89326d90d`.

Scope: SKILL.md, local Python search entry point, imports and sensitive-operation paths in core.py, design_system.py and reasoning_contract.py, CLI package scripts and network/credential references, MIT license, relevant guidance.

The local search uses standard-library Python and bundled CSV data. No network requests, shell execution, credential reads, or dynamic eval/exec were found in the inspected search path. Optional persistence writes design files; we ran without persistence. The only inspected environment read in this path is COLORTERM for terminal formatting.

The separate CLI downloads GitHub releases, can use GitHub credentials, and can write installed skill files. We did not install or execute that CLI, global npm packages, or repository hooks. The checkout stays in the system temporary directory, outside this application.

We used non-sensitive generic product queries. The review supports this limited use of the pinned local search scripts; it is not an exhaustive security audit or assurance about future versions. No third-party script is shipped in the app.

Queries: `podcast learning workspace --design-system`, `podcast audio --domain color`, and one narrower design-system retry `educational reading tool`. Result fit and deviations are recorded in design.md.
