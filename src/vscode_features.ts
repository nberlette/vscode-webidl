import * as vscode from "vscode";
import * as webidl from "./webidl_service.ts";
import type { ValidationResult } from "./types.ts";

let diagnosticCollection: vscode.DiagnosticCollection | undefined;

export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection(
    "webidl",
  );
  context.subscriptions.push(diagnosticCollection);
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (isWebIDL(doc)) {
        refreshDiagnostics(doc);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((ev) => {
      if (isWebIDL(ev.document)) {
        refreshDiagnostics(ev.document);
      }
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (
        diagnosticCollection &&
        isWebIDL(doc) &&
        diagnosticCollection.has(doc.uri)
      ) {
        diagnosticCollection.delete(doc.uri);
      }
    }),
    vscode.commands.registerCommand("webidl.validate", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && isWebIDL(editor.document)) {
        refreshDiagnostics(editor.document, true);
      } else {
        vscode.window.showInformationMessage(
          "Open a WebIDL document to validate.",
        );
      }
    }),
    vscode.commands.registerCommand("webidl.format", async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && isWebIDL(editor.document)) {
        const edits = createFormattingEdits(editor.document);
        if (edits.length === 0) {
          return;
        }
        await editor.edit((builder) => {
          for (const edit of edits) {
            builder.replace(edit.range, edit.newText);
          }
        });
      } else {
        vscode.window.showInformationMessage(
          "Open a WebIDL document to format.",
        );
      }
    }),
    vscode.languages.registerDocumentFormattingEditProvider(
      { language: "webidl" },
      {
        provideDocumentFormattingEdits(
          document: vscode.TextDocument,
        ): vscode.TextEdit[] {
          return createFormattingEdits(document);
        },
      },
    ),
  );
}

export function deactivate(): void {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
    diagnosticCollection = undefined;
  }
}

export function createFormattingEdits(
  document: vscode.TextDocument,
): vscode.TextEdit[] {
  const original = document.getText();
  const formatted = webidl.format(original, documentSourceName(document));
  if (formatted === original) {
    return [];
  }
  return [
    vscode.TextEdit.replace(fullDocumentRange(document), formatted),
  ];
}

export function buildDiagnosticsForDocument(
  document: vscode.TextDocument,
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  try {
    const tree = webidl.parse(document.getText(), documentSourceName(document));
    const results = webidl.validate(tree) as ValidationResult[];
    for (const result of results) {
      const diag = new vscode.Diagnostic(
        rangeFromWebIDLError(document, result),
        diagnosticMessage(result, "Validation"),
        result.level === "warning"
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Error,
      );
      diag.source = "webidl2";
      if (result.ruleName) {
        diag.code = result.ruleName;
      }
      diagnostics.push(diag);
    }
  } catch (error) {
    const err = error as Partial<ValidationResult>;
    const diag = new vscode.Diagnostic(
      rangeFromWebIDLError(document, err),
      diagnosticMessage(err, "Syntax"),
      vscode.DiagnosticSeverity.Error,
    );
    diag.source = "webidl2";
    diagnostics.push(diag);
  }
  return diagnostics;
}

function refreshDiagnostics(
  document: vscode.TextDocument,
  showNotification: boolean = false,
): void {
  if (!diagnosticCollection) {
    return;
  }
  const diagnostics = buildDiagnosticsForDocument(document);
  diagnosticCollection.set(document.uri, diagnostics);
  if (showNotification && diagnostics.length === 0) {
    vscode.window.showInformationMessage(
      "No WebIDL validation issues found.",
    );
  } else if (showNotification && diagnostics.length > 0) {
    const firstError = diagnostics.find((diag) =>
      diag.severity === vscode.DiagnosticSeverity.Error
    );
    if (firstError) {
      vscode.window.showErrorMessage(firstError.message);
    }
  }
}

function isWebIDL(document: vscode.TextDocument): boolean {
  return document.languageId === "webidl";
}

function documentSourceName(document: vscode.TextDocument): string {
  const fileName = (document as vscode.TextDocument & { fileName?: string })
    .fileName;
  if (fileName) {
    return fileName;
  }
  const uriPath = (document.uri as vscode.Uri & { path?: string }).path;
  return uriPath || "<untitled>";
}

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
  const start = new vscode.Position(0, 0);
  const positionAt = (document as vscode.TextDocument & {
    positionAt?(offset: number): vscode.Position;
  }).positionAt;
  if (positionAt) {
    return new vscode.Range(
      start,
      positionAt.call(document, document.getText().length),
    );
  }
  const end = document.lineAt(document.lineCount - 1).range.end;
  return new vscode.Range(start, end);
}

function diagnosticMessage(
  error: Partial<ValidationResult>,
  kind: "Syntax" | "Validation",
): string {
  const message = error.bareMessage || error.message;
  const cleanMessage = message
    ? String(message).replace(/\s+/g, " ").trim()
    : "Unknown WebIDL error";
  if (kind === "Validation" && error.ruleName) {
    return `${cleanMessage} (${error.ruleName})`;
  }
  return `${kind} error: ${cleanMessage}`;
}

function rangeFromWebIDLError(
  document: vscode.TextDocument,
  error: Partial<ValidationResult>,
): vscode.Range {
  const enriched = error as Partial<SourceRange>;
  if (enriched.start && enriched.end) {
    return new vscode.Range(
      new vscode.Position(
        clampZeroBasedLine(document, enriched.start.line),
        enriched.start.column,
      ),
      new vscode.Position(
        clampZeroBasedLine(document, enriched.end.line),
        enriched.end.column,
      ),
    );
  }

  const token = error.tokens?.[0];
  const line = clampLine(
    document,
    token?.line ?? error.line ?? 1,
  );
  const lineText = document.lineAt(line).text;
  const tokenText = token?.value ?? "";
  const inputText = error.input?.split(/\r?\n/, 1)[0] ?? "";
  const startCharacter = findStartCharacter(
    lineText,
    error.context,
    inputText,
    tokenText,
  );
  const width = tokenText.length > 0 ? tokenText.length : 1;
  return new vscode.Range(
    new vscode.Position(line, startCharacter),
    new vscode.Position(
      line,
      Math.min(lineText.length, startCharacter + width),
    ),
  );
}

interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

interface SourceLocation {
  line: number;
  column: number;
}

function clampLine(
  document: vscode.TextDocument,
  oneBasedLine: number,
): number {
  if (!Number.isFinite(oneBasedLine)) {
    return 0;
  }
  return Math.max(0, Math.min(document.lineCount - 1, oneBasedLine - 1));
}

function clampZeroBasedLine(
  document: vscode.TextDocument,
  line: number,
): number {
  if (!Number.isFinite(line)) {
    return 0;
  }
  return Math.max(0, Math.min(document.lineCount - 1, line));
}

function findStartCharacter(
  lineText: string,
  contextText: string | undefined,
  inputText: string,
  tokenText: string,
): number {
  const fromContext = findContextMarker(lineText, contextText);
  if (fromContext >= 0) {
    return fromContext;
  }
  if (inputText) {
    const fromInput = lineText.indexOf(inputText);
    if (fromInput >= 0) {
      return fromInput;
    }
  }
  if (tokenText) {
    const fromToken = lineText.indexOf(tokenText);
    if (fromToken >= 0) {
      return fromToken;
    }
  }
  const firstText = lineText.search(/\S/);
  return firstText >= 0 ? firstText : 0;
}

function findContextMarker(
  lineText: string,
  contextText: string | undefined,
): number {
  if (!contextText) {
    return -1;
  }
  const lines = contextText.split(/\r?\n/);
  const markerLine = lines.find((line) => line.includes("^"));
  if (!markerLine) {
    return -1;
  }
  const markerIndex = markerLine.indexOf("^");
  const sourceLine = lines[lines.indexOf(markerLine) - 1];
  if (!sourceLine) {
    return -1;
  }
  const sourceStart = lineText.indexOf(sourceLine);
  return sourceStart >= 0 ? sourceStart + markerIndex : -1;
}
