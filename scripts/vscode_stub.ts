export type Disposable = { dispose(): void };

export interface Uri {
  readonly path?: string;
}

export interface PositionLike {
  line: number;
  character: number;
}

export class Position implements PositionLike {
  constructor(
    public line: number,
    public character: number,
  ) {}
}

export class Range {
  constructor(
    public start: Position,
    public end: Position,
  ) {}
}

export class Diagnostic {
  code?: string;
  source?: string;

  constructor(
    public range: Range,
    public message: string,
    public severity: DiagnosticSeverity,
  ) {}
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export class TextEdit {
  static replace(range: Range, newText: string): TextEdit {
    return new TextEdit(range, newText);
  }

  constructor(
    public range: Range,
    public newText: string,
  ) {}
}

export interface TextLine {
  text: string;
  range: {
    end: Position;
  };
}

export interface TextDocument {
  languageId: string;
  fileName: string;
  lineCount: number;
  uri: Uri;
  getText(): string;
  lineAt(line: number): TextLine;
}

export interface TextDocumentChangeEvent {
  document: TextDocument;
}

export interface TextEditorEdit {
  replace(range: Range, newText: string): void;
}

export interface TextEditor {
  document: TextDocument;
  edit(
    callback: (builder: TextEditorEdit) => void,
  ): Promise<boolean>;
}

export interface DiagnosticCollection extends Disposable {
  delete(uri: Uri): void;
  has(uri: Uri): boolean;
  set(uri: Uri, diagnostics: Diagnostic[]): void;
}

export interface DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(document: TextDocument): TextEdit[];
}

export interface DocumentSelector {
  language: string;
}

export interface ExtensionContext {
  subscriptions: {
    push(...items: Disposable[]): number;
  };
}

function noopDisposable(): Disposable {
  return {
    dispose() {},
  };
}

const emptyCollection: DiagnosticCollection = {
  ...noopDisposable(),
  delete() {},
  has() {
    return false;
  },
  set() {},
};

export const languages = {
  createDiagnosticCollection(_name?: string): DiagnosticCollection {
    return emptyCollection;
  },
  registerDocumentFormattingEditProvider(
    _selector: DocumentSelector,
    _provider: DocumentFormattingEditProvider,
  ): Disposable {
    return noopDisposable();
  },
};

export const workspace = {
  onDidOpenTextDocument(
    _listener: (document: TextDocument) => void,
  ): Disposable {
    return noopDisposable();
  },
  onDidChangeTextDocument(
    _listener: (event: TextDocumentChangeEvent) => void,
  ): Disposable {
    return noopDisposable();
  },
  onDidCloseTextDocument(
    _listener: (document: TextDocument) => void,
  ): Disposable {
    return noopDisposable();
  },
};

export const window = {
  activeTextEditor: undefined as TextEditor | undefined,
  showErrorMessage(_message: string): void {},
  showInformationMessage(_message: string): void {},
};

export const commands = {
  registerCommand(
    _command: string,
    _callback: (...args: unknown[]) => unknown,
  ): Disposable {
    return noopDisposable();
  },
};
