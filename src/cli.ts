#!/usr/bin/env node
// cli.ts
// Command-line interface entry point for html-dwt-cmd-template

// MUST be first - sets up vscode module shim
import { setupCLIEnvironment } from './setup-cli-environment';
setupCLIEnvironment();

import * as path from 'path';
import * as fs from 'fs';
import {
  initializeCLI,
  syncTemplate as syncTemplateCmd,
  updateAllFiles as updateAllFilesCmd,
  findInstances as findInstancesCmd,
  createPage as createPageCmd,
  showRegions as showRegionsCmd,
  restoreBackup as restoreBackupCmd,
  CliContext
} from './cli/commands';

// Parse command-line arguments
function parseArgs(argv: string[]): {
  command: string;
  templatePath?: string;
  instancePath?: string;
  outputPath?: string;
  autoApply?: boolean;
  noBackup?: boolean;
  help?: boolean;
  cwd?: string;
} {
  const args = argv.slice(2);
  const result: ReturnType<typeof parseArgs> = {
    command: args[0] || 'help',
    autoApply: false,
    noBackup: false,
    help: false,
    cwd: process.cwd()
  };

  // Check if first arg is --help or -h
  if (args[0] === '--help' || args[0] === '-h') {
    result.help = true;
    result.command = 'help';
    return result;
  }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--template' || arg === '-t') {
      result.templatePath = args[++i];
    } else if (arg === '--instance' || arg === '-i') {
      result.instancePath = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      result.outputPath = args[++i];
    } else if (arg === '--auto-apply' || arg === '-a') {
      result.autoApply = true;
    } else if (arg === '--no-backup') {
      result.noBackup = true;
    } else if (arg === '--cwd') {
      result.cwd = args[++i];
    } else if (!result.templatePath && !arg.startsWith('--')) {
      result.templatePath = arg;
    }
  }

  return result;
}

function showHelp() {
  console.log(`
HTML Dreamweaver Template Command-Line Tool
Version 1.0.0

USAGE:
  html-dwt-cmd [command] [options]

COMMANDS:
  sync [template]          Sync a template file with its instances
  update-all [template]    Update all files using the specified template
  find-instances [template] Find all instance files using a template
  create-page [template]   Create a new page from a template
  show-regions [file]      Show editable regions in a file
  restore-backup          Restore the last backup
  help                    Show this help message

OPTIONS:
  --template, -t <path>   Path to the template file
  --instance, -i <path>   Path to the instance file
  --output, -o <path>     Output path for created files
  --auto-apply, -a        Automatically apply changes without prompting
  --no-backup             Skip creating backups before updates
  --cwd <path>            Set working directory (site root)
  --help, -h              Show help for a command

EXAMPLES:
  # Sync a template with its instances (with prompts)
  html-dwt-cmd sync Templates/main.dwt

  # Update all files automatically without prompts
  html-dwt-cmd update-all Templates/main.dwt --auto-apply

  # Update without creating backups (use with caution)
  html-dwt-cmd update-all Templates/main.dwt --auto-apply --no-backup

  # Find all pages using a template
  html-dwt-cmd find-instances Templates/main.dwt

  # Create a new page from a template
  html-dwt-cmd create-page Templates/main.dwt --output pages/new-page.html

  # Show editable regions in a file
  html-dwt-cmd show-regions pages/index.html

  # Restore from the last backup
  html-dwt-cmd restore-backup

ENVIRONMENT:
  The tool expects to be run from the site root directory containing
  a Templates/ folder, or you can specify --cwd to set the site root.

  Backups are automatically created in .html-dwt-cmd-template-backups/
  before any template updates are applied.
`);
}

async function main() {
  // Set a global timeout of 20 seconds for debugging
  const timeoutHandle = setTimeout(() => {
    console.error('\n⏱️  Operation timed out after 20 seconds');
    process.exit(124);
  }, 20000);

  const args = parseArgs(process.argv);

  // Show help without requiring Templates directory
  if (args.help || args.command === 'help') {
    showHelp();
    process.exit(0);
  }

  // Change to the specified working directory if provided
  if (args.cwd) {
    try {
      process.chdir(args.cwd);
    } catch (error) {
      console.error(`Error: Cannot change to directory ${args.cwd}`);
      process.exit(1);
    }
  }

  const siteRoot = process.cwd();

  // Validate we're in a site root with Templates folder
  const templatesDir = path.join(siteRoot, 'Templates');
  if (!fs.existsSync(templatesDir)) {
    console.error('Error: Templates directory not found.');
    console.error('Make sure you are running this from a site root directory,');
    console.error('or use --cwd to specify the site root path.');
    console.error('');
    console.error('Run "html-dwt-cmd --help" for usage information.');
    process.exit(1);
  }

  // Initialize the CLI platform
  await initializeCLI(siteRoot);

  const context: CliContext = {
    siteRoot,
    autoApply: args.autoApply || false,
    noBackup: args.noBackup || false
  };

  try {
    switch (args.command) {
      case 'sync':
        if (!args.templatePath) {
          console.error('Error: Template path is required');
          console.error('Usage: html-dwt-cmd sync <template-path>');
          process.exit(1);
        }
        await syncTemplateCmd(context, args.templatePath);
        break;

      case 'update-all':
        if (!args.templatePath) {
          console.error('Error: Template path is required');
          console.error('Usage: html-dwt-cmd update-all <template-path>');
          process.exit(1);
        }
        await updateAllFilesCmd(context, args.templatePath);
        break;

      case 'find-instances':
        if (!args.templatePath) {
          console.error('Error: Template path is required');
          console.error('Usage: html-dwt-cmd find-instances <template-path>');
          process.exit(1);
        }
        await findInstancesCmd(context, args.templatePath);
        break;

      case 'create-page':
        if (!args.templatePath) {
          console.error('Error: Template path is required');
          console.error('Usage: html-dwt-cmd create-page <template-path> --output <output-path>');
          process.exit(1);
        }
        await createPageCmd(context, args.templatePath, args.outputPath);
        break;

      case 'show-regions':
        if (!args.templatePath) {
          console.error('Error: File path is required');
          console.error('Usage: html-dwt-cmd show-regions <file-path>');
          process.exit(1);
        }
        await showRegionsCmd(context, args.templatePath);
        break;

      case 'restore-backup':
        await restoreBackupCmd(context);
        break;

      default:
        console.error(`Unknown command: ${args.command}`);
        console.error('Run with --help to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    clearTimeout(timeoutHandle);
  }
  
  // Exit successfully
  process.exit(0);
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
