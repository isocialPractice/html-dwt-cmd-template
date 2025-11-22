// adapters/types.ts
// Type definitions for platform-agnostic interfaces

export interface Uri {
  fsPath: string;
  toString(): string;
}

export interface Position {
  line: number;
  character: number;
  isAfter(other: Position): boolean;
  isAfterOrEqual(other: Position): boolean;
  isBefore(other: Position): boolean;
  isBeforeOrEqual(other: Position): boolean;
  isEqual(other: Position): boolean;
  compareTo(other: Position): number;
  translate(lineDelta?: number, characterDelta?: number): Position;
  translate(change: { lineDelta?: number; characterDelta?: number }): Position;
  with(line?: number, character?: number): Position;
  with(change: { line?: number; character?: number }): Position;
}

export interface Range {
  start: Position;
  end: Position;
  isEmpty: boolean;
  contains(positionOrRange: Position | Range): boolean;
  intersection(range: Range): Range | undefined;
  isAfterOrEqual(position: Position): boolean;
}

export interface TextDocument {
  uri: Uri;
  fileName: string;
  getText(range?: Range): string;
  lineAt(line: number): TextLine;
  lineCount: number;
  positionAt(offset: number): Position;
  offsetAt(position: Position): number;
}

export interface TextLine {
  text: string;
  range: Range;
  rangeIncludingLineBreak: Range;
}

export type MessageType = 'info' | 'warning' | 'error';

export interface ProgressOptions {
  location: 'notification' | 'window';
  title: string;
  cancellable?: boolean;
}

export interface Progress {
  report(value: { increment?: number; message?: string }): void;
}

export interface UserInteraction {
  showMessage(message: string, type: MessageType, ...items: string[]): Promise<string | undefined>;
  showQuickPick(items: string[], options?: { placeHolder?: string }): Promise<string | undefined>;
  withProgress<T>(
    options: ProgressOptions,
    task: (progress: Progress, token: CancellationToken) => Promise<T>
  ): Promise<T>;
}

export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: (listener: () => void) => void;
}

export interface OutputChannel {
  name: string;
  appendLine(value: string): void;
  append(value: string): void;
  clear(): void;
  show(): void;
  hide(): void;
  dispose(): void;
  replace(value: string): void;
}

export interface WorkspaceFolder {
  uri: Uri;
  name: string;
}

export interface Workspace {
  workspaceFolders?: WorkspaceFolder[];
  findFiles(include: string, exclude?: string): Promise<Uri[]>;
  getConfiguration(section: string): Configuration;
}

export interface Configuration {
  get<T>(key: string, defaultValue?: T): T | undefined;
  has(key: string): boolean;
  update(key: string, value: any): Promise<void>;
}
