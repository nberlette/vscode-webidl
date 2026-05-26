import { strict as assert } from "node:assert";
import {
  buildDiagnosticsForDocument,
  createFormattingEdits,
} from "../src/extension.ts";
import type * as vscode from "vscode";

Deno.test("extension entry points export activate and deactivate", async () => {
  const ext = await import("../src/extension.ts");
  assert.equal(typeof ext.activate, "function");
  assert.equal(typeof ext.deactivate, "function");
});

Deno.test("formatting edits support untitled WebIDL documents", () => {
  const document = createDocument(
    "interface Foo{attribute boolean bar;};",
    undefined,
  );
  const edits = createFormattingEdits(document);
  assert.equal(edits.length, 1);
  assert.equal(
    edits[0].newText,
    `[Exposed=Window]
interface Foo {
    attribute boolean bar;
};`,
  );
});

Deno.test("diagnostics use concise messages and token ranges", () => {
  const document = createDocument(
    "interface Foo { attribute sequence<long> data; };",
    "bad.webidl",
  );
  const diagnostics = buildDiagnosticsForDocument(document);
  const attrDiagnostic = diagnostics.find((diag) =>
    diag.code === "attr-invalid-type"
  );
  assert.ok(attrDiagnostic);
  assert.equal(
    attrDiagnostic.message,
    "Attributes cannot accept sequence types. (attr-invalid-type)",
  );
  assert.equal(attrDiagnostic.range.start.line, 0);
  assert.equal(attrDiagnostic.range.start.character, 41);
  assert.equal(attrDiagnostic.range.end.character, 45);
});

Deno.test("syntax diagnostics use enriched parser token ranges", () => {
  const document = createDocument(
    `[Exposed=Window]
interface Foo {
    attribute DOMString ok;
    attribute DOMString bad
};`,
    "bad.webidl",
  );
  const diagnostics = buildDiagnosticsForDocument(document);
  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0].message, /Unterminated attribute/);
  assert.equal(diagnostics[0].range.start.line, 4);
  assert.equal(diagnostics[0].range.start.character, 0);
  assert.equal(diagnostics[0].range.end.line, 4);
  assert.equal(diagnostics[0].range.end.character, 1);
});

function createDocument(
  text: string,
  fileName: string | undefined,
): vscode.TextDocument {
  const lines = text.split(/\r?\n/);
  return {
    languageId: "webidl",
    fileName,
    lineCount: lines.length,
    uri: { path: fileName },
    getText() {
      return text;
    },
    lineAt(line: number) {
      const lineText = lines[line] ?? "";
      return {
        text: lineText,
        range: {
          end: {
            line,
            character: lineText.length,
          },
        },
      };
    },
  } as vscode.TextDocument;
}
