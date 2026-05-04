// features/update/templateHierarchy
// Utilities to discover child templates and walk template inheritance.

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getRealPathSafe, isPathInsideRoot, resolveFileSystemEntry } from '../../utils/fileSystemSafety';
import { isTemplateFilePath } from '../../utils/templatePaths';

function collectTemplateCandidates(siteRoot: string): vscode.Uri[] {
  const templatesRoot = path.join(siteRoot, 'Templates');
  const templatesRootInfo = resolveFileSystemEntry(templatesRoot);
  if (!templatesRootInfo || !templatesRootInfo.isDirectory) {
    return [];
  }

  const candidates: vscode.Uri[] = [];
  const seenRealPaths = new Set<string>();

  try {
    const entries = fs.readdirSync(templatesRoot, { withFileTypes: true });
    for (const entry of entries) {
      const candidatePath = path.join(templatesRoot, entry.name);
      const candidateInfo = resolveFileSystemEntry(candidatePath);
      if (!candidateInfo || !candidateInfo.isFile) {
        continue;
      }

      if (!isTemplateFilePath(candidateInfo.logicalPath)) {
        continue;
      }

      if (seenRealPaths.has(candidateInfo.realPath)) {
        continue;
      }

      seenRealPaths.add(candidateInfo.realPath);
      candidates.push(vscode.Uri.file(candidateInfo.logicalPath));
    }
  } catch (error) {
    console.error(`Error reading template directory ${templatesRoot}:`, error);
  }

  return candidates;
}

export async function findChildTemplates(templatePath: string): Promise<vscode.Uri[]> {
  const childTemplates: vscode.Uri[] = [];
  const templateName = path.basename(templatePath).toLowerCase();
  const templateDir = path.dirname(templatePath);
  const siteRoot = path.dirname(templateDir);
  const templateRealPath = getRealPathSafe(templatePath);
  const relativeTemplatePath = path.relative(siteRoot, templatePath).replace(/\\/g, '/');
  const expectedReference = relativeTemplatePath.startsWith('..') ? undefined : `/${relativeTemplatePath}`.toLowerCase();
  const seenTemplates = new Set<string>();

  try {
    const templateFiles = collectTemplateCandidates(siteRoot);
    for (const templateFile of templateFiles) {
      const templateInfo = resolveFileSystemEntry(templateFile.fsPath);
      if (!templateInfo || !templateInfo.isFile) continue;
      if (!isPathInsideRoot(templateInfo.logicalPath, siteRoot)) continue;
      if (templateInfo.realPath === templateRealPath || seenTemplates.has(templateInfo.realPath)) continue;

      try {
        const content = fs.readFileSync(templateFile.fsPath, 'utf8');
        const headSlice = content.slice(0, 600);
        const instanceBeginRegex = /<!--\s*InstanceBegin\s+template="([^"]+)"/i;
        const match = headSlice.match(instanceBeginRegex);
        if (match) {
          const referencedTemplate = match[1].replace(/\\/g, '/');
          const referencedTemplateName = path.basename(referencedTemplate).toLowerCase();
          const matchesByName = referencedTemplateName === templateName;
          const matchesByPath = expectedReference ? referencedTemplate.toLowerCase() === expectedReference : false;
          if (matchesByName || matchesByPath) {
            seenTemplates.add(templateInfo.realPath);
            childTemplates.push(templateFile);
          }
        }
      } catch (error) {
        console.error(`Error reading template file ${templateFile.fsPath}:`, error);
      }
    }
  } catch (error) {
    console.error('Error finding child templates:', error);
  }
  return childTemplates;
}

export async function findAllChildTemplatesRecursive(templatePath: string): Promise<vscode.Uri[]> {
  const discovered: vscode.Uri[] = [];
  const visited = new Set<string>([templatePath]);
  const queue: string[] = [templatePath];
  while (queue.length > 0) {
    const current = queue.shift()!;
    try {
      const directChildren = await findChildTemplates(current);
      for (const child of directChildren) {
        if (!visited.has(child.fsPath)) {
          visited.add(child.fsPath);
          discovered.push(child);
          queue.push(child.fsPath);
        }
      }
    } catch (error) {
      console.error(`Error while searching nested templates for ${current}:`, error);
    }
  }
  return discovered;
}
