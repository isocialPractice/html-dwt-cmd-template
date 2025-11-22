// adapters/cli-adapter.ts
// CLI implementation of platform interfaces

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {
  Uri,
  Position,
  Range,
  TextDocument,
  TextLine,
  UserInteraction,
  MessageType,
  OutputChannel,
  Workspace,
  WorkspaceFolder,
  Configuration,
  Progress,
  CancellationToken,
  ProgressOptions
} from './types';

// Simple Uri implementation for CLI
export class CliUri implements Uri {
  constructor(public fsPath: string) {}
  
  toString(): string {
    return `file://${this.fsPath}`;
  }

  static file(fsPath: string): CliUri {
    return new CliUri(fsPath);
  }
}

// Position implementation
export class CliPosition implements Position {
  constructor(public line: number, public character: number) {}

  isAfter(other: Position): boolean {
    return this.line > other.line || (this.line === other.line && this.character > other.character);
  }

  isAfterOrEqual(other: Position): boolean {
    return this.isAfter(other) || this.isEqual(other);
  }

  isBefore(other: Position): boolean {
    return this.line < other.line || (this.line === other.line && this.character < other.character);
  }

  isBeforeOrEqual(other: Position): boolean {
    return this.isBefore(other) || this.isEqual(other);
  }

  isEqual(other: Position): boolean {
    return this.line === other.line && this.character === other.character;
  }

  compareTo(other: Position): number {
    if (this.line < other.line) return -1;
    if (this.line > other.line) return 1;
    if (this.character < other.character) return -1;
    if (this.character > other.character) return 1;
    return 0;
  }

  translate(lineDeltaOrChange?: number | { lineDelta?: number; characterDelta?: number }, characterDelta?: number): Position {
    if (typeof lineDeltaOrChange === 'object') {
      const lineDelta = lineDeltaOrChange.lineDelta ?? 0;
      const charDelta = lineDeltaOrChange.characterDelta ?? 0;
      return new CliPosition(this.line + lineDelta, this.character + charDelta);
    }
    const lineDelta = lineDeltaOrChange ?? 0;
    const charDelta = characterDelta ?? 0;
    return new CliPosition(this.line + lineDelta, this.character + charDelta);
  }

  with(lineOrChange?: number | { line?: number; character?: number }, character?: number): Position {
    if (typeof lineOrChange === 'object') {
      const line = lineOrChange.line ?? this.line;
      const char = lineOrChange.character ?? this.character;
      return new CliPosition(line, char);
    }
    const line = lineOrChange ?? this.line;
    const char = character ?? this.character;
    return new CliPosition(line, char);
  }
}

// Range implementation
export class CliRange implements Range {
  constructor(public start: Position, public end: Position) {}

  get isEmpty(): boolean {
    return this.start.isEqual(this.end);
  }

  contains(positionOrRange: Position | Range): boolean {
    if ('line' in positionOrRange) {
      const pos = positionOrRange as Position;
      return this.start.isBeforeOrEqual(pos) && this.end.isAfterOrEqual(pos);
    } else {
      const range = positionOrRange as Range;
      return this.start.isBeforeOrEqual(range.start) && this.end.isAfterOrEqual(range.end);
    }
  }

  intersection(range: Range): Range | undefined {
    const start = this.start.isAfter(range.start) ? this.start : range.start;
    const end = this.end.isBefore(range.end) ? this.end : range.end;
    if (start.isAfterOrEqual(end)) {
      return undefined;
    }
    return new CliRange(start, end);
  }

  isAfterOrEqual(position: Position): boolean {
    return this.start.isAfterOrEqual(position);
  }
}

// TextDocument implementation
export class CliTextDocument implements TextDocument {
  private lines: string[];
  
  constructor(public uri: Uri, private content: string) {
    this.lines = content.split('\n');
  }

  get fileName(): string {
    return this.uri.fsPath;
  }

  getText(range?: Range): string {
    if (!range) {
      return this.content;
    }
    
    const startLine = range.start.line;
    const endLine = range.end.line;
    
    if (startLine === endLine) {
      return this.lines[startLine].substring(range.start.character, range.end.character);
    }
    
    const result: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      if (i === startLine) {
        result.push(this.lines[i].substring(range.start.character));
      } else if (i === endLine) {
        result.push(this.lines[i].substring(0, range.end.character));
      } else {
        result.push(this.lines[i]);
      }
    }
    return result.join('\n');
  }

  lineAt(line: number): TextLine {
    const text = this.lines[line] || '';
    const start = new CliPosition(line, 0);
    const end = new CliPosition(line, text.length);
    const range = new CliRange(start, end);
    const rangeIncludingLineBreak = new CliRange(start, new CliPosition(line, text.length + 1));
    
    return { text, range, rangeIncludingLineBreak };
  }

  get lineCount(): number {
    return this.lines.length;
  }

  positionAt(offset: number): Position {
    const text = this.content.substring(0, offset);
    const lines = text.split('\n');
    const line = lines.length - 1;
    const character = lines[line].length;
    return new CliPosition(line, character);
  }

  offsetAt(position: Position): number {
    let offset = 0;
    for (let i = 0; i < position.line && i < this.lines.length; i++) {
      offset += this.lines[i].length + 1; // +1 for newline
    }
    offset += Math.min(position.character, this.lines[position.line]?.length ?? 0);
    return offset;
  }

  static fromFile(filePath: string): CliTextDocument {
    const content = fs.readFileSync(filePath, 'utf8');
    const uri = new CliUri(filePath);
    return new CliTextDocument(uri, content);
  }
}

// OutputChannel implementation for CLI
export class CliOutputChannel implements OutputChannel {
  private buffer: string[] = [];

  constructor(public name: string) {}

  appendLine(value: string): void {
    console.log(value);
    this.buffer.push(value);
  }

  append(value: string): void {
    process.stdout.write(value);
    this.buffer.push(value);
  }

  clear(): void {
    this.buffer = [];
  }

  show(): void {
    // In CLI, already showing via console
  }

  hide(): void {
    // No-op in CLI
  }

  dispose(): void {
    this.buffer = [];
  }

  replace(value: string): void {
    this.buffer = [value];
    console.log(value);
  }
}

// Simple CancellationToken implementation
export class CliCancellationToken implements CancellationToken {
  private _isCancellationRequested = false;
  private listeners: Array<() => void> = [];

  get isCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }

  cancel(): void {
    this._isCancellationRequested = true;
    this.listeners.forEach(listener => listener());
  }

  onCancellationRequested(listener: () => void): void {
    this.listeners.push(listener);
  }
}

// UserInteraction implementation for CLI
export class CliUserInteraction implements UserInteraction {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async showMessage(message: string, type: MessageType, ...items: string[]): Promise<string | undefined> {
    const prefix = type === 'error' ? '[ERROR]' : type === 'warning' ? '[WARNING]' : '[INFO]';
    console.log(`${prefix} ${message}`);
    
    if (items.length === 0) {
      return undefined;
    }

    console.log('Options:');
    items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });

    const answer = await this.question('Select an option (number): ');
    const index = parseInt(answer, 10) - 1;
    
    if (index >= 0 && index < items.length) {
      return items[index];
    }
    
    return undefined;
  }

  async showQuickPick(items: string[], options?: { placeHolder?: string }): Promise<string | undefined> {
    if (options?.placeHolder) {
      console.log(options.placeHolder);
    }
    
    items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });

    const answer = await this.question('Select an option (number): ');
    const index = parseInt(answer, 10) - 1;
    
    if (index >= 0 && index < items.length) {
      return items[index];
    }
    
    return undefined;
  }

  async withProgress<T>(
    options: ProgressOptions,
    task: (progress: Progress, token: CancellationToken) => Promise<T>
  ): Promise<T> {
    console.log(`\n${options.title}`);
    
    const progress: Progress = {
      report: (value) => {
        if (value.message) {
          console.log(`  ${value.message}`);
        }
      }
    };

    const token = new CliCancellationToken();
    
    // Setup Ctrl+C handler if cancellable
    if (options.cancellable) {
      const handler = () => {
        console.log('\nCancelling...');
        token.cancel();
      };
      process.on('SIGINT', handler);
      
      try {
        return await task(progress, token);
      } finally {
        process.off('SIGINT', handler);
      }
    }
    
    return await task(progress, token);
  }

  private question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, resolve);
    });
  }

  close(): void {
    this.rl.close();
  }
}

// Configuration implementation for CLI
export class CliConfiguration implements Configuration {
  private config: Map<string, any> = new Map();

  constructor(private defaults: Record<string, any> = {}) {
    Object.entries(defaults).forEach(([key, value]) => {
      this.config.set(key, value);
    });
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    if (this.config.has(key)) {
      return this.config.get(key) as T;
    }
    return defaultValue;
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  async update(key: string, value: any): Promise<void> {
    this.config.set(key, value);
  }
}

// Workspace implementation for CLI
export class CliWorkspace implements Workspace {
  workspaceFolders?: WorkspaceFolder[];
  private configurations: Map<string, Configuration> = new Map();

  constructor(rootPath: string) {
    this.workspaceFolders = [
      {
        uri: new CliUri(rootPath),
        name: path.basename(rootPath)
      }
    ];

    // Setup default configurations
    this.configurations.set('dreamweaverTemplate', new CliConfiguration({
      useStickyDiffPanel: false,
      enableProtection: false, // Disabled for CLI
      showWarnings: true,
      highlightEditableRegions: false,
      highlightProtectedRegions: false,
      autoSyncOnTemplateChange: false, // Manual in CLI
      enableTemplateSync: true,
      confirmBeforeApply: true
    }));
  }

  async findFiles(include: string, exclude?: string): Promise<Uri[]> {
    if (!this.workspaceFolders || this.workspaceFolders.length === 0) {
      return [];
    }

    const rootPath = this.workspaceFolders[0].uri.fsPath;
    const results: Uri[] = [];

    // Expand brace patterns like *.{html,htm,php} to multiple patterns
    const expandBraces = (pattern: string): string[] => {
      const braceMatch = pattern.match(/\{([^}]+)\}/);
      if (!braceMatch) {
        return [pattern];
      }
      
      const options = braceMatch[1].split(',');
      const prefix = pattern.substring(0, braceMatch.index);
      const suffix = pattern.substring(braceMatch.index! + braceMatch[0].length);
      
      return options.flatMap(opt => expandBraces(prefix + opt.trim() + suffix));
    };

    const includePatterns = expandBraces(include);
    
    const includeRegexes = includePatterns.map(pattern => {
      // Convert glob to regex: ** = any path, * = any chars except /, . = literal dot
      let regexPattern = pattern
        .split('**').map(part => 
          part.split('*').map(segment => 
            segment.replace(/\./g, '\\.')
          ).join('[^/]*')
        ).join('.*');
      
      // If pattern starts with **/, make the path part optional to match root files too
      // e.g., .*/[^/]*\.html becomes (.*/)?[^/]*\.html
      if (pattern.startsWith('**/')) {
        regexPattern = regexPattern.replace(/^\.\*\//, '(.*/)?');
      }
      
      return new RegExp(regexPattern);
    });

    const excludePatterns = exclude ? expandBraces(exclude) : [];
    const excludeRegexes = excludePatterns.map(pattern => {
      let regexPattern = pattern
        .split('**').map(part => 
          part.split('*').map(segment => 
            segment.replace(/\./g, '\\.')
          ).join('[^/\\\\]*')
        ).join('.*');
      
      // Make path optional for **/ patterns (match files at any level including root)
      if (pattern.startsWith('**/')) {
        regexPattern = regexPattern.replace(/^\.\.\\*\//, '(.*/)?');
      }
      
      return new RegExp(regexPattern);
    });

    const walkDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const relativePath = path.relative(rootPath, filePath).replace(/\\/g, '/');
        
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Simple directory exclusion check - skip backup and template dirs
          if (file === 'Templates' || file.startsWith('.html-dwt-')) {
            continue;
          }
          walkDir(filePath);
        } else {
          // Check if file path should be included
          if (includeRegexes.some(regex => regex.test(relativePath))) {
            results.push(new CliUri(filePath));
          }
        }
      }
    };

    walkDir(rootPath);
    return results;
  }

  getConfiguration(section: string): Configuration {
    if (!this.configurations.has(section)) {
      this.configurations.set(section, new CliConfiguration());
    }
    return this.configurations.get(section)!;
  }
}
