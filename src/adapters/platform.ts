// adapters/platform.ts
// Platform abstraction layer that can use either VS Code or CLI adapters

import type * as vscode from 'vscode';
import {
  Uri,
  Position,
  Range,
  TextDocument,
  UserInteraction,
  OutputChannel,
  Workspace,
  Configuration
} from './types';

// Platform interface
export interface Platform {
  Uri: {
    file(path: string): Uri;
  };
  Position: new (line: number, character: number) => Position;
  Range: new (start: Position, end: Position) => Range;
  TextDocument: {
    fromFile(filePath: string): TextDocument;
  };
  workspace: Workspace;
  interaction: UserInteraction;
  createOutputChannel(name: string): OutputChannel;
}

let currentPlatform: Platform | null = null;

export function setPlatform(platform: Platform): void {
  currentPlatform = platform;
}

export function getPlatform(): Platform {
  if (!currentPlatform) {
    throw new Error('Platform not initialized. Call setPlatform() first.');
  }
  return currentPlatform;
}

// Helper to check if we're in VS Code environment
export function isVSCodeEnvironment(): boolean {
  try {
    return typeof require('vscode') !== 'undefined';
  } catch {
    return false;
  }
}

// VS Code platform adapter
export function createVSCodePlatform(vscodeModule: typeof vscode): Platform {
  return {
    Uri: {
      file: (path: string) => vscodeModule.Uri.file(path) as Uri
    },
    Position: vscodeModule.Position as any,
    Range: vscodeModule.Range as any,
    TextDocument: {
      fromFile: (filePath: string) => {
        // For VS Code, we need to use the workspace API synchronously via a workaround
        // In practice, VS Code extension won't use this - it will use openTextDocument directly
        const uri = vscodeModule.Uri.file(filePath);
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf8');
        // Return a minimal TextDocument-like object for CLI compatibility
        // VS Code extensions should use workspace.openTextDocument instead
        return {
          uri: uri as any,
          fileName: filePath,
          getText: () => content,
          lineAt: (line: number) => ({ text: content.split('\n')[line] || '' }) as any,
          lineCount: content.split('\n').length,
          positionAt: (offset: number) => {
            const text = content.substring(0, offset);
            const lines = text.split('\n');
            return new vscodeModule.Position(lines.length - 1, lines[lines.length - 1].length);
          },
          offsetAt: (pos: any) => {
            const lines = content.split('\n');
            let offset = 0;
            for (let i = 0; i < pos.line && i < lines.length; i++) {
              offset += lines[i].length + 1;
            }
            offset += Math.min(pos.character, lines[pos.line]?.length ?? 0);
            return offset;
          }
        } as TextDocument;
      }
    },
    workspace: vscodeModule.workspace as any as Workspace,
    interaction: {
      showMessage: async (message: string, type, ...items: string[]) => {
        if (type === 'error') {
          return vscodeModule.window.showErrorMessage(message, { modal: true }, ...items);
        } else if (type === 'warning') {
          return vscodeModule.window.showWarningMessage(message, { modal: true }, ...items);
        } else {
          return vscodeModule.window.showInformationMessage(message, { modal: true }, ...items);
        }
      },
      showQuickPick: async (items: string[], options?) => {
        return vscodeModule.window.showQuickPick(items, options);
      },
      withProgress: async (options, task) => {
        return vscodeModule.window.withProgress(
          {
            location: options.location === 'notification'
              ? vscodeModule.ProgressLocation.Notification
              : vscodeModule.ProgressLocation.Window,
            title: options.title,
            cancellable: options.cancellable
          },
          task as any
        );
      }
    },
    createOutputChannel: (name: string) => {
      return vscodeModule.window.createOutputChannel(name) as any as OutputChannel;
    }
  };
}

// CLI platform adapter
export function createCLIPlatform(rootPath: string): Platform {
  const {
    CliUri,
    CliPosition,
    CliRange,
    CliTextDocument,
    CliOutputChannel,
    CliUserInteraction,
    CliWorkspace
  } = require('./cli-adapter');

  return {
    Uri: {
      file: (path: string) => new CliUri(path)
    },
    Position: CliPosition,
    Range: CliRange,
    TextDocument: {
      fromFile: (filePath: string) => CliTextDocument.fromFile(filePath)
    },
    workspace: new CliWorkspace(rootPath),
    interaction: new CliUserInteraction(),
    createOutputChannel: (name: string) => new CliOutputChannel(name)
  };
}
