// vscode-shim.ts
// Minimal vscode module shim for CLI mode
// This allows updateEngine.ts to import vscode without errors

export class Position {
  constructor(public line: number, public character: number) {}
  
  compareTo(other: Position): number {
    if (this.line < other.line) return -1;
    if (this.line > other.line) return 1;
    if (this.character < other.character) return -1;
    if (this.character > other.character) return 1;
    return 0;
  }
  
  isEqual(other: Position): boolean {
    return this.line === other.line && this.character === other.character;
  }
  
  isBefore(other: Position): boolean {
    return this.compareTo(other) < 0;
  }
  
  isAfter(other: Position): boolean {
    return this.compareTo(other) > 0;
  }
  
  translate(lineDelta?: number, characterDelta?: number): Position;
  translate(change: { lineDelta?: number; characterDelta?: number }): Position;
  translate(arg1?: any, arg2?: any): Position {
    const lineDelta = typeof arg1 === 'number' ? arg1 : (arg1?.lineDelta || 0);
    const characterDelta = typeof arg2 === 'number' ? arg2 : (arg1?.characterDelta || 0);
    return new Position(this.line + lineDelta, this.character + characterDelta);
  }
  
  with(line?: number, character?: number): Position;
  with(change: { line?: number; character?: number }): Position;
  with(arg1?: any, arg2?: any): Position {
    const line = typeof arg1 === 'number' ? arg1 : (arg1?.line ?? this.line);
    const character = typeof arg2 === 'number' ? arg2 : (arg1?.character ?? this.character);
    return new Position(line, character);
  }
}

export class Range {
  constructor(public start: Position, public end: Position) {}
  
  get isEmpty(): boolean {
    return this.start.isEqual(this.end);
  }
  
  get isSingleLine(): boolean {
    return this.start.line === this.end.line;
  }
  
  contains(positionOrRange: Position | Range): boolean {
    if (positionOrRange instanceof Range) {
      return this.contains(positionOrRange.start) && this.contains(positionOrRange.end);
    }
    return !positionOrRange.isBefore(this.start) && !positionOrRange.isAfter(this.end);
  }
  
  isEqual(other: Range): boolean {
    return this.start.isEqual(other.start) && this.end.isEqual(other.end);
  }
  
  intersection(other: Range): Range | undefined {
    const start = this.start.isAfter(other.start) ? this.start : other.start;
    const end = this.end.isBefore(other.end) ? this.end : other.end;
    if (start.isAfter(end)) return undefined;
    return new Range(start, end);
  }
  
  union(other: Range): Range {
    const start = this.start.isBefore(other.start) ? this.start : other.start;
    const end = this.end.isAfter(other.end) ? this.end : other.end;
    return new Range(start, end);
  }
  
  with(start?: Position, end?: Position): Range;
  with(change: { start?: Position; end?: Position }): Range;
  with(arg1?: any, arg2?: any): Range {
    const start = arg1 instanceof Position ? arg1 : (arg1?.start ?? this.start);
    const end = arg2 instanceof Position ? arg2 : (arg1?.end ?? this.end);
    return new Range(start, end);
  }
}

export class Uri {
  static file(fsPath: string): Uri {
    return new Uri('file', '', fsPath, '', '');
  }
  
  static parse(value: string): Uri {
    // Simple parsing, assume file:// URIs
    if (value.startsWith('file://')) {
      return Uri.file(value.substring(7));
    }
    return Uri.file(value);
  }
  
  constructor(
    public scheme: string,
    public authority: string,
    public path: string,
    public query: string,
    public fragment: string
  ) {}
  
  get fsPath(): string {
    return this.path;
  }
  
  toString(): string {
    return `${this.scheme}://${this.authority}${this.path}${this.query ? '?' + this.query : ''}${this.fragment ? '#' + this.fragment : ''}`;
  }
  
  with(change: {
    scheme?: string;
    authority?: string;
    path?: string;
    query?: string;
    fragment?: string;
  }): Uri {
    return new Uri(
      change.scheme ?? this.scheme,
      change.authority ?? this.authority,
      change.path ?? this.path,
      change.query ?? this.query,
      change.fragment ?? this.fragment
    );
  }
}

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15
}

// Stub classes
export const window = {
  showInformationMessage: async (message: string, ...items: any[]) => {
    console.log('ℹ️', message);
    return items[0];
  },
  showWarningMessage: async (message: string, ...items: any[]) => {
    console.warn('⚠️', message);
    return items[0];
  },
  showErrorMessage: async (message: string, ...items: any[]) => {
    console.error('❌', message);
    return items[0];
  },
  withProgress: async (options: any, task: any) => {
    console.log('⏳', options.title);
    return await task({
      report: () => {}
    }, {
      isCancellationRequested: false,
      onCancellationRequested: () => ({ dispose: () => {} })
    });
  },
  createOutputChannel: (name: string) => ({
    append: () => {},
    appendLine: () => {},
    clear: () => {},
    show: () => {},
    hide: () => {},
    dispose: () => {},
    name,
    replace: () => {}
  }),
  visibleTextEditors: [],
  activeTextEditor: undefined,
  setStatusBarMessage: () => ({ dispose: () => {} })
};

export const workspace = {
  findFiles: async (include: string, exclude?: string) => {
    return [];
  },
  getConfiguration: (section: string) => ({
    get: () => undefined,
    has: () => false,
    inspect: () => undefined,
    update: async () => {}
  }),
  workspaceFolders: undefined
};

export const commands = {
  executeCommand: async (command: string, ...args: any[]) => {
    // Stub - do nothing
    return undefined;
  }
};

export interface OutputChannel {
  append(value: string): void;
  appendLine(value: string): void;
  clear(): void;
  show(preserveFocus?: boolean): void;
  hide(): void;
  dispose(): void;
  name: string;
  replace(value: string): void;
}

export class EventEmitter<T = any> {
  private listeners: Array<(e: T) => void> = [];
  
  get event() {
    return (listener: (e: T) => void) => {
      this.listeners.push(listener);
      return {
        dispose: () => {
          const index = this.listeners.indexOf(listener);
          if (index >= 0) {
            this.listeners.splice(index, 1);
          }
        }
      };
    };
  }
  
  fire(data: T): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('EventEmitter error:', error);
      }
    });
  }
  
  dispose(): void {
    this.listeners = [];
  }
}
