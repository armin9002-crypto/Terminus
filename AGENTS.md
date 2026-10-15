# Terminus - Codex working rules

## Project context
- Treat current source, package scripts, and recent commits as runtime truth. README text and older plans may be stale; investigate mismatches before relying on them.
- Read only the code and documentation relevant to the task. Minor edits do not require a repository-wide survey. Reuse established patterns and helpers.

## Product and implementation
- Keep financial modeling correctness separate from presentation work. Changes to calculations must preserve and validate financial semantics; visual changes must not alter inputs, assumptions, or results.
- Build a sophisticated, coherent interface with intentional responsive behavior. Preserve Terminus's visual language; do not add generic dashboard styling or unrelated redesigns.
- Protect unrelated work. Check Git status before editing; never reset, discard, overwrite, or silently absorb unrelated changes. Do not expose credentials, tokens, or private data.

## Delegation
- The parent owns scope, architecture, financial decisions, integration, and final verification. Do small tasks directly; delegate only independent, bounded work when it improves speed or evidence.
- Assign clear file ownership. Avoid overlapping edits, repeated exploration, and duplicate tests. Keep delegation within the configured concurrency limit.
- Read-only investigations must not edit files, run write-producing operations, commit, push, deploy, or otherwise publish changes.

## Verification and delivery
- Choose checks proportionate to the change and the repository's existing scripts. Do not add tests or run broad suites for documentation-only changes unless requested or executable behavior changes.
- For explicitly authorized implementation work, finish proportionate verification and, when the working branch and user scope authorize it, commit and push; verify any deployment triggered automatically by that push and the resulting production behavior when the change ships.
- Follow the existing Git/Vercel workflow. Do not invent deployment infrastructure or manually deploy production for configuration-only or documentation-only changes.
- Report what changed and the checks, commit, push, and deployment status actually observed.
