// utils/workspaceContext
// Helpers to validate that commands run within a proper workspace/site context.

import { Uri } from '../adapters/types';
import { isTemplateFilePath } from './templatePaths';

// VS Code-compatible synchronous version
export function ensureWorkspaceContext(templateUri?: Uri): boolean {
  // In VS Code extension context, use vscode directly
  try {
    const vscode = require('vscode');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open. Open the site root folder to use Dreamweaver template features.');
      return false;
    }
    if (templateUri && !isTemplateFilePath(templateUri.fsPath)) {
      vscode.window.showWarningMessage('Active file is not a supported template. Open a template file within the Templates folder (.dwt, .html, .htm, .php).');
      return false;
    }
    return true;
  } catch {
    // In CLI context, assume validation happens elsewhere
    return true;
  }
}

// CLI-compatible async version for use in CLI commands
export async function ensureWorkspaceContextAsync(templateUri?: Uri): Promise<boolean> {
  try {
    const { getPlatform } = require('../adapters/platform');
    const platform = getPlatform();
    const workspaceFolder = platform.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      await platform.interaction.showMessage(
        'No workspace folder open. Open the site root folder to use Dreamweaver template features.',
        'error'
      );
      return false;
    }
    if (templateUri && !isTemplateFilePath(templateUri.fsPath)) {
      await platform.interaction.showMessage(
        'Active file is not a supported template. Open a template file within the Templates folder (.dwt, .html, .htm, .php).',
        'warning'
      );
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
