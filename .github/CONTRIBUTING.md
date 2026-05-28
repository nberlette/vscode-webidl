# Contributing to vscode-webidl

Thank you for your interest in improving the WebIDL Language Support extension
for VS Code. This guide explains how to set up the project, make changes, and
send contributions that are straightforward to review.

Please also read the [code of conduct](CODE_OF_CONDUCT.md). By participating in
this project, you agree to follow it.

## Project overview

This repository is a VS Code extension that supports both desktop and web
runtimes.

- `src/extension.ts` contains the desktop extension entry point.
- `src/web/extension.ts` contains the web extension entry point.
- `src/webidl_service.ts` contains the shared WebIDL parsing, validation, and
  formatting logic.
- `syntaxes/webidl.tmLanguage.json` contains the TextMate grammar.
- `language-configuration.json` contains editor language behavior.
- `tests/` contains Deno tests for the shared service and extension entry
  points.
- `scripts/package.ts` builds the local `.vsix` package.

The extension uses [`webidl2`](https://github.com/w3c/webidl2.js/) for parsing,
validation, and formatting.

## Prerequisites

Use Deno 2. The project declares the expected runtime in `package.json` under
`devEngines`, and dependencies are resolved through Deno using `deno.lock`.

You do not need to run `npm install`.

## Local setup

From the repository root:

```sh
deno install
deno task build
deno task test
```

Useful development commands:

| Command                   | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `deno task typecheck`     | Type-check the TypeScript sources.                        |
| `deno task build`         | Build desktop and web extension artifacts.                |
| `deno task test`          | Run the test suite.                                       |
| `deno task test:coverage` | Run tests with Deno coverage output.                      |
| `deno task ci`            | Run the same core verification flow expected before a PR. |
| `deno task package`       | Build a local `.vsix` package in `.artifacts/`.           |
| `deno task watch`         | Watch TypeScript compilation.                             |
| `deno task watch:web`     | Watch the web extension bundle.                           |

For formatting and linting:

```sh
deno fmt --check
deno lint
```

Run `deno fmt` before opening a PR when Markdown, JSON, or TypeScript files need
formatting.

## Making changes

Before starting larger work, open an issue or discussion so the approach can be
confirmed. Small bug fixes, documentation fixes, tests, and obvious maintenance
updates can go straight to a pull request.

When changing behavior:

- Add or update focused tests in `tests/`.
- Keep desktop and web runtime behavior aligned where possible.
- Prefer shared logic in `src/webidl_service.ts` when code is used by both
  extension entry points.
- Avoid committing generated output from `dist/`, `dist-test/`, `coverage/`, or
  `.artifacts/`.
- Keep changes scoped to the issue or feature being addressed.

When changing the grammar or language configuration:

- Include before-and-after examples in the PR description.
- Check representative `.webidl` and `.idl` snippets in VS Code if the change
  affects highlighting, comments, brackets, indentation, or activation.
- Add tests where the changed behavior is covered by TypeScript code.

## Pull request checklist

Before requesting review, please make sure:

- The branch is based on the latest `main`.
- `deno task ci` passes locally.
- `deno fmt --check` passes, or formatting changes are intentional.
- Relevant tests or documentation have been added or updated.
- The PR description explains the problem, the fix, and any tradeoffs.
- Commit messages follow Conventional Commits.
- UI-visible behavior is described with screenshots, recordings, or concise
  examples when applicable.

## Commit and PR style

Commit messages must follow
[Conventional Commits](https://www.conventionalcommits.org/). Use a lowercase
type, an optional scope, and a concise summary:

```text
<type>(optional-scope): <summary>
```

Common types for this project include `fix`, `feat`, `docs`, `test`, `build`,
`ci`, `refactor`, and `chore`.

Good examples:

```text
fix: preserve parser token ranges in diagnostics
test: cover formatting for dictionary defaults
docs: clarify local packaging workflow
```

Pull requests should be small enough to review comfortably. If a change needs to
be large, describe the structure of the PR and call out the files reviewers
should read first.

## Release process

Releases are handled by GitHub Actions in `.github/workflows/ci.yml`.

On pushes and pull requests, CI type-checks, builds, tests, and packages the
extension. On tag pushes, CI also verifies that the tag matches the
`package.json` version, publishes the packaged `.vsix` to the Visual Studio
Marketplace, and creates a GitHub Release.

Maintainers need a repository secret named `VSCE_PAT` containing a Visual Studio
Marketplace personal access token for publishing.

## Reporting bugs

When filing a bug, include:

- The extension version.
- The VS Code or compatible editor version.
- Whether the issue happens in the desktop extension, web extension, or both.
- A minimal WebIDL snippet or reproduction steps.
- The expected behavior and the actual behavior.
- Any diagnostics, logs, screenshots, or error messages that help explain the
  issue.

## Requesting features

Feature requests are most useful when they explain the workflow being improved.
Please include examples of the WebIDL input, desired editor behavior, and any
relevant references to the WebIDL specification or `webidl2` behavior.

## Security issues

Please do not open public issues for vulnerabilities. Report security-sensitive
problems privately through GitHub's security advisory flow when available, or by
emailing the maintainer listed in `package.json`.

## Questions

If you are unsure where to start, open an issue with the context you have. A
small reproduction or concrete example is usually enough to begin the
conversation.
