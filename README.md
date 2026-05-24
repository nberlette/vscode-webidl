# vscode-webidl

This extension brings a complete editing experience for
[Web IDL](https://www.w3.org/TR/WebIDL/) to Visual Studio Code on both the
desktop and the Web. It provides syntax highlighting, on‑the‑fly validation,
semantic linting, formatting and simple commands to help you work with WebIDL
definitions more productively.

## Features

The extension uses the [webidl2](https://github.com/w3c/webidl2.js/) library
under the hood to parse, validate and format your IDL. You get:

- **Syntax highlighting:** A comprehensive TextMate grammar describes WebIDL
  syntax so that keywords, literals, identifiers and punctuation are colored
  correctly.
- **Automatic diagnostics:** Whenever you open or edit a WebIDL file the
  extension parses it and runs semantic validation. Diagnostics are shown inline
  in the editor with error or warning severity depending on the issue. The
  validation logic is powered by `webidl2.validate()`. Syntax and semantic
  problems are reported with concise messages, rule names where available, and
  precise token ranges when the parser exposes them.
- **Document formatting:** You can reformat a WebIDL document using either the
  `WebIDL: Format Document` command or the built‑in _Format Document_ action.
  Formatting parses the document, applies any available autofixes and
  regenerates canonical output using `webidl2.write()`. Autofixes are applied
  transparently to your buffer.
- **Manual validation:** Use the `WebIDL: Validate Document` command to run
  validation on demand. When no problems are found an informational notification
  appears.

### Commands

| Command ID        | Description                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `webidl.format`   | Formats the current WebIDL document in place using `webidl2.write()` and any available autofixes.                                          |
| `webidl.validate` | Parses and validates the active WebIDL document using `webidl2.parse()` and `webidl2.validate()`. Diagnostics are published to the editor. |

## Usage

1. Install the extension from the VS Code Marketplace or by side‑loading the
   `.vsix` created from this repository.
2. Open a file with a `.webidl` or `.idl` extension. The extension activates
   automatically on the first WebIDL file.
3. Edit your WebIDL as usual. Syntax errors are highlighted immediately.
   Semantic warnings (for example, using a `sequence` type on an attribute)
   appear as you type.
4. Run **WebIDL: Format Document** from the command palette
   (`⇧⌘P`/`Ctrl+Shift+P`) to reflow your definitions. The formatter parses the
   AST with `webidl2.parse()`, applies autofixes exposed by `webidl2.validate()`
   and then writes the result with `webidl2.write()`.
5. Run **WebIDL: Validate Document** to manually re‑evaluate the current file
   and see a summary in the notifications area.

### Example

The following IDL contains a semantic error: an attribute may not have a
sequence type. When the file is opened or edited, the extension adds a
diagnostic to the offending token.

```webidl
interface Example {
  attribute sequence<long> data;
};
```

The validation API in `webidl2` returns an array of problem objects whose
`message`, `line`, `level`, token and rule fields describe the issue. The
extension enriches those tokens with source ranges, converts the results into
VS Code diagnostics and displays them inline. Formatting the example would leave
the semantic error intact but tidy up whitespace and braces.

### Configuration

The extension relies only on the built‑in VS Code settings. There are no custom
configuration options at this time, but you can control editor behavior through
standard settings such as `editor.formatOnSave` to automatically format WebIDL
files on save.

## Developing

This repository is structured as a standard VS Code extension with support for
both the desktop and web runtimes. The entry points are in `src/extension.ts`
(desktop) and `src/web/extension.ts` (web). Shared logic lives in
`src/webidl_service.ts`.

The repo uses Deno 2 for local development. The task definitions live in
`package.json`, and Deno resolves them via `deno task <script-name>`.
Dependencies are installed and cached by Deno as needed.

1. **Install/cache dependencies:**
   ```sh
   deno install
   ```
2. **Build the desktop and web extension artifacts:**
   ```sh
   deno task build
   ```
3. **Run the test suite:**
   ```sh
   deno task test
   ```
4. **Run the full local verification flow:**
   ```sh
   deno task ci
   ```
5. **Create a `.vsix` package locally:**
   ```sh
   deno task package
   ```

### Release automation

The GitHub Actions workflow in `.github/workflows/ci.yml` now handles both
verification and tagged releases:

- It runs type-checking, builds the desktop/web artifacts, executes the tests,
  and uploads the packaged `.vsix` as a workflow artifact on pushes, pull
  requests, and manual runs.
- On tag pushes, it additionally verifies that the tag matches the
  `package.json` version, publishes that same `.vsix` to the Visual Studio
  Marketplace, and creates a GitHub Release with the artifact attached.

To make the release workflow work, add a repository secret named `VSCE_PAT`
containing a Visual Studio Marketplace personal access token for your publisher.

The test suite uses native `deno test` to exercise every exported API function.
See the mirrored files under `tests/` for examples and edge-case coverage.

---

[MIT] © [Nicholas Berlette]. All rights reserved.

[MIT]: https://nick.mit-license.org "MIT © Nicholas Berlette"
[Nicholas Berlette]: https://github.com/nberlette "Follow Nicholas Berlette on GitHub"
[github]: https://github.com/nberlette/vscode-webidl "Give the vscode-webidl extension a star on GitHub! ⭐"
[issues]: https://github.com/nberlette/vscode-webidl/issues "Report issues on GitHub"
[webidl2]: https://github.com/w3c/webidl2.js/#readme "The webidl2.js library on GitHub"
[webidl2.ts]: https://github.com/nberlette/webidl2.ts "A TypeScript port of webidl2.js on GitHub"
