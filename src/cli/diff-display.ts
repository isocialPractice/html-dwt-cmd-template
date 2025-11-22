// cli/diff-display.ts
// Console-based diff display for CLI mode

import { structuredPatch } from 'diff';
import * as chalk from 'chalk';
import { getPlatform } from '../adapters/platform';

export function displayDiff(
  oldContent: string,
  newContent: string,
  fileName: string
): void {
  const patch = structuredPatch(
    fileName,
    fileName,
    oldContent,
    newContent,
    'Original',
    'Modified'
  );

  console.log(chalk.bold(`\n=== Diff for ${fileName} ===\n`));

  if (patch.hunks.length === 0) {
    console.log(chalk.gray('No changes detected.\n'));
    return;
  }

  for (const hunk of patch.hunks) {
    console.log(chalk.cyan(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`));
    
    for (const line of hunk.lines) {
      if (line.startsWith('-')) {
        console.log(chalk.red(line));
      } else if (line.startsWith('+')) {
        console.log(chalk.green(line));
      } else {
        console.log(chalk.gray(line));
      }
    }
  }
  
  console.log('');
}

export async function showDiffAndPrompt(
  oldContent: string,
  newContent: string,
  fileName: string,
  autoApply: boolean = false
): Promise<'apply' | 'skip' | 'apply-all' | 'cancel'> {
  displayDiff(oldContent, newContent, fileName);
  
  if (autoApply) {
    console.log(chalk.green(`Auto-applying changes to ${fileName}\n`));
    return 'apply';
  }
  
  const platform = getPlatform();
  const choice = await platform.interaction.showMessage(
    `Apply changes to ${fileName}?`,
    'info',
    'Apply',
    'Apply to All',
    'Skip',
    'Cancel'
  );
  
  if (choice === 'Apply') return 'apply';
  if (choice === 'Apply to All') return 'apply-all';
  if (choice === 'Skip') return 'skip';
  return 'cancel';
}
