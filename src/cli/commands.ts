// cli/commands.ts
// CLI command implementations using the core engine

import * as fs from 'fs';
import * as path from 'path';
import { getPlatform, setPlatform, createCLIPlatform } from '../adapters/platform';
import { Uri } from '../adapters/types';
import { isDreamweaverTemplate } from '../utils/templateDetection';
import { initializeLogger, logProcessCompletion } from '../utils/logger';
import { CliTextDocument } from '../adapters/cli-adapter';
import { createHtmlBackups, restoreHtmlFromBackup, getLastBackupInfo } from '../utils/backups';

// Import the update engine (it still uses vscode types internally, but we can call it)
// We'll need to create a compatibility layer
import { 
  updateHtmlLikeDreamweaver as engineUpdateHtml,
  updateHtmlBasedOnTemplate as engineUpdateBasedOnTemplate,
  UpdateHtmlBasedOnTemplateOptions 
} from '../features/update/updateEngine';

export interface CliContext {
  siteRoot: string;
  autoApply: boolean;
}

export async function initializeCLI(siteRoot: string): Promise<void> {
  setPlatform(createCLIPlatform(siteRoot));
  initializeLogger();
}

// Helper to convert our URI to vscode-like URI
function toVscodeUri(uri: Uri): any {
  return {
    fsPath: uri.fsPath,
    toString: () => uri.toString(),
    scheme: 'file',
    path: uri.fsPath,
    authority: '',
    query: '',
    fragment: '',
    with: () => toVscodeUri(uri)
  };
}

export async function syncTemplate(context: CliContext, templatePath: string): Promise<void> {
  const platform = getPlatform();
  const fullTemplatePath = path.isAbsolute(templatePath) ? templatePath : path.join(context.siteRoot, templatePath);

  if (!fs.existsSync(fullTemplatePath)) {
    console.error(`Template file not found: ${fullTemplatePath}`);
    process.exit(1);
  }

  console.log(`Syncing template: ${path.basename(fullTemplatePath)}`);
  console.log(`Site root: ${context.siteRoot}`);
  
  // TODO: Implement sync logic using updateEngine
  console.log('Sync functionality will be implemented using the update engine');
  
  logProcessCompletion('cli:sync', 0);
}

export async function updateAllFiles(context: CliContext, templatePath: string): Promise<void> {
  const fullTemplatePath = path.isAbsolute(templatePath) ? templatePath : path.join(context.siteRoot, templatePath);

  if (!fs.existsSync(fullTemplatePath)) {
    console.error(`Template file not found: ${fullTemplatePath}`);
    process.exit(1);
  }

  console.log(`Updating all files using template: ${path.basename(fullTemplatePath)}`);
  console.log(`Site root: ${context.siteRoot}`);
  console.log(`Auto-apply: ${context.autoApply ? 'Yes' : 'No'}\n`);
  
  // In CLI mode, we always use auto-apply to avoid interactive prompts
  // Users can review changes via git diff or backups
  if (!context.autoApply) {
    console.log('⚠️  CLI mode requires --auto-apply flag for non-interactive operation.');
    console.log('    Changes will be backed up and can be reviewed/reverted.');
    process.exit(1);
  }
  
  try {
    const platform = getPlatform();
    const templateUri = toVscodeUri(platform.Uri.file(fullTemplatePath));
    
    // Create a mock vscode environment for the engine
    const mockVscode = createMockVscodeForEngine(context);
    
    // Call the engine with options
    const options: UpdateHtmlBasedOnTemplateOptions = {
      autoApplyAll: true, // Always auto-apply in CLI
      suppressCompletionPrompt: true
    };
    
    // The engine expects certain globals to exist
    (global as any).vscode = mockVscode;
    
    await engineUpdateBasedOnTemplate(
      templateUri,
      options,
      {
        findTemplateInstances: async (templatePath: string) => {
          return await findInstancesForTemplate(context.siteRoot, templatePath);
        },
        updateChildTemplateLikeDreamweaver: async (childUri: any, parentPath: string, opts?: any) => {
          return await engineUpdateHtml(childUri, parentPath, opts || {}, createEngineDeps(context));
        },
        updateHtmlLikeDreamweaver: async (instanceUri: any, templatePath: string, opts: any) => {
          return await engineUpdateHtml(instanceUri, templatePath, opts, createEngineDeps(context));
        },
        getOutputChannel: () => initializeLogger(),
        logProcessCompletion,
        isProtectionEnabledGetter: () => false, // No protection in CLI
        setProtectionEnabled: () => {},
        getApplyToAll: () => true, // Always true in CLI
        setApplyToAll: () => {},
        getCancelRun: () => false,
        setCancelRun: () => {}
      }
    );
    
    console.log('\n✅ Update completed successfully!');
    logProcessCompletion('cli:update-all', 0);
  } catch (error) {
    console.error('\n❌ Update failed:', error instanceof Error ? error.message : String(error));
    logProcessCompletion('cli:update-all', 1);
    process.exit(1);
  }
}

// Helper to find instances of a template
async function findInstancesForTemplate(siteRoot: string, templatePath: string): Promise<any[]> {
  const platform = getPlatform();
  const templateName = path.basename(templatePath);
  
  const files = await platform.workspace.findFiles('**/*.{html,htm,php}', '**/{Templates,.html-dwt-cmd-template-backups,.html-dwt-template-backups,.html-dwt-cmd-template-temp}/**');
  
  const instances: any[] = [];
  for (const uri of files) {
    try {
      const content = fs.readFileSync(uri.fsPath, 'utf8');
      const instanceBeginMatch = content.match(/<!--\s*InstanceBegin\s+template="([^"]+)"[^>]*-->/i);
      if (instanceBeginMatch) {
        const usedTemplate = path.basename(instanceBeginMatch[1]);
        if (usedTemplate === templateName) {
          console.log(`  ✓ ${path.relative(siteRoot, uri.fsPath)}`);
          instances.push(toVscodeUri(uri));
        }
      }
    } catch {}
  }
  
  return instances;
}

// Create engine dependencies
function createEngineDeps(context: CliContext) {
  return {
    outputChannel: initializeLogger(),
    logProcessCompletion,
    getApplyToAll: () => context.autoApply,
    setApplyToAll: () => {},
    getCancelRun: () => false,
    setCancelRun: () => {}
  };
}

// Create a mock vscode object for the engine
function createMockVscodeForEngine(context: CliContext) {
  const platform = getPlatform();
  
  return {
    Uri: {
      file: (fsPath: string) => toVscodeUri(platform.Uri.file(fsPath))
    },
    Position: class {
      constructor(public line: number, public character: number) {}
    },
    Range: class {
      constructor(public start: any, public end: any) {}
    },
    ProgressLocation: {
      Notification: 'notification',
      Window: 'window'
    },
    window: {
      showInformationMessage: async (msg: string, ...items: any[]) => {
        const opts = items.find(i => typeof i === 'object' && i.modal !== undefined);
        const buttons = items.filter(i => typeof i === 'string');
        return await platform.interaction.showMessage(msg, 'info', ...buttons);
      },
      showWarningMessage: async (msg: string, ...items: any[]) => {
        const buttons = items.filter(i => typeof i === 'string');
        return await platform.interaction.showMessage(msg, 'warning', ...buttons);
      },
      showErrorMessage: async (msg: string, ...items: any[]) => {
        const buttons = items.filter(i => typeof i === 'string');
        return await platform.interaction.showMessage(msg, 'error', ...buttons);
      },
      withProgress: async (opts: any, task: any) => {
        return await platform.interaction.withProgress(
          {
            location: opts.location === 'notification' ? 'notification' : 'window',
            title: opts.title,
            cancellable: opts.cancellable
          },
          task
        );
      },
      createOutputChannel: (name: string) => initializeLogger(),
      visibleTextEditors: [],
      activeTextEditor: undefined,
      setStatusBarMessage: () => ({ dispose: () => {} })
    },
    workspace: {
      findFiles: async (pattern: string, exclude?: string) => {
        const files = await platform.workspace.findFiles(pattern, exclude);
        return files.map(uri => toVscodeUri(uri));
      },
      getConfiguration: (section: string) => platform.workspace.getConfiguration(section),
      workspaceFolders: platform.workspace.workspaceFolders?.map(f => ({
        uri: toVscodeUri(f.uri),
        name: f.name,
        index: 0
      }))
    },
    commands: {
      executeCommand: async (cmd: string, ...args: any[]) => {
        // Ignore vscode.diff commands in CLI mode
        if (cmd === 'vscode.diff') {
          console.log('  [Diff view skipped in CLI mode]');
        }
        return undefined;
      }
    }
  };
}

export async function findInstances(context: CliContext, templatePath: string): Promise<void> {
  const platform = getPlatform();
  const fullTemplatePath = path.isAbsolute(templatePath) ? templatePath : path.join(context.siteRoot, templatePath);

  if (!fs.existsSync(fullTemplatePath)) {
    console.error(`Template file not found: ${fullTemplatePath}`);
    process.exit(1);
  }

  const templateName = path.basename(fullTemplatePath);
  console.log(`Finding instances of template: ${templateName}\n`);

  // Find all HTML/PHP files excluding the Templates directory
  const files = await platform.workspace.findFiles('**/*.{html,htm,php}', '**/Templates/**');
  
  const instances: string[] = [];
  for (const uri of files) {
    try {
      const content = fs.readFileSync(uri.fsPath, 'utf8');
      const doc = new CliTextDocument(uri, content);
      
      if (isDreamweaverTemplate(doc)) {
        // Check if this file uses our template
        const instanceBeginMatch = content.match(/<!--\s*InstanceBegin\s+template="([^"]+)"[^>]*-->/i);
        if (instanceBeginMatch) {
          const usedTemplate = path.basename(instanceBeginMatch[1]);
          if (usedTemplate === templateName) {
            const relativePath = path.relative(context.siteRoot, uri.fsPath);
            instances.push(relativePath);
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  if (instances.length === 0) {
    console.log('No instances found.');
  } else {
    console.log(`Found ${instances.length} instance(s):\n`);
    instances.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
  }

  logProcessCompletion('cli:find-instances', 0);
}

export async function createPage(context: CliContext, templatePath: string, outputPath?: string): Promise<void> {
  const fullTemplatePath = path.isAbsolute(templatePath) ? templatePath : path.join(context.siteRoot, templatePath);

  if (!fs.existsSync(fullTemplatePath)) {
    console.error(`Template file not found: ${fullTemplatePath}`);
    process.exit(1);
  }

  if (!outputPath) {
    console.error('Output path is required. Use --output <path>');
    process.exit(1);
  }

  const fullOutputPath = path.isAbsolute(outputPath) ? outputPath : path.join(context.siteRoot, outputPath);

  console.log(`Creating new page from template: ${path.basename(fullTemplatePath)}`);
  console.log(`Output: ${outputPath}`);
  
  // TODO: Implement page creation logic
  console.log('Create page functionality will be implemented');
  
  logProcessCompletion('cli:create-page', 0);
}

export async function showRegions(context: CliContext, filePath: string): Promise<void> {
  const fullFilePath = path.isAbsolute(filePath) ? filePath : path.join(context.siteRoot, filePath);

  if (!fs.existsSync(fullFilePath)) {
    console.error(`File not found: ${fullFilePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullFilePath, 'utf8');
  const doc = new CliTextDocument({ fsPath: fullFilePath, toString: () => `file://${fullFilePath}` }, content);

  if (!isDreamweaverTemplate(doc)) {
    console.log('This file does not appear to be a Dreamweaver template or instance.');
    return;
  }

  console.log(`Editable regions in: ${path.basename(fullFilePath)}\n`);

  // Find all editable regions
  const editablePattern = /<!--\s*(?:InstanceBeginEditable|TemplateBeginEditable)\s+name="([^"]+)"\s*-->/gi;
  const regions: string[] = [];
  let match;

  while ((match = editablePattern.exec(content)) !== null) {
    const regionName = match[1];
    if (!regions.includes(regionName)) {
      regions.push(regionName);
    }
  }

  if (regions.length === 0) {
    console.log('No editable regions found.');
  } else {
    console.log(`Found ${regions.length} editable region(s):\n`);
    regions.forEach((region, index) => {
      console.log(`  ${index + 1}. ${region}`);
    });
  }

  logProcessCompletion('cli:show-regions', 0);
}

export async function restoreBackup(context: CliContext): Promise<void> {
  const backupInfo = getLastBackupInfo();
  
  if (!backupInfo) {
    console.log('No backup information found.');
    console.log('Backups are created automatically before template updates.');
    return;
  }

  console.log(`\nLast backup information:`);
  console.log(`  Template: ${backupInfo.templateName}`);
  console.log(`  Files: ${backupInfo.instances.length}`);
  console.log(`  Location: ${backupInfo.backupDir}`);

  const platform = getPlatform();
  const confirm = await platform.interaction.showMessage(
    `Restore ${backupInfo.instances.length} file(s) from backup?`,
    'warning',
    'Yes',
    'No'
  );

  if (confirm === 'Yes') {
    await restoreHtmlFromBackup();
    console.log('\nBackup restored successfully.');
    logProcessCompletion('cli:restore-backup', 0);
  } else {
    console.log('\nRestore cancelled.');
    logProcessCompletion('cli:restore-backup', 2);
  }
}
