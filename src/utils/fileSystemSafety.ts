// fileSystemSafety
// Helpers to classify filesystem entries and enforce logical site-root scope safely.

import * as fs from 'fs';
import * as path from 'path';

export interface FileSystemEntryInfo {
  logicalPath: string;
  realPath: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
}

export function getRealPathSafe(entryPath: string): string {
  try {
    if (typeof fs.realpathSync.native === 'function') {
      return fs.realpathSync.native(entryPath);
    }
    return fs.realpathSync(entryPath);
  } catch {
    return path.resolve(entryPath);
  }
}

export function isPathInsideRoot(candidatePath: string, rootPath: string): boolean {
  const relativePath = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

export function isPathInsideResolvedRoot(candidatePath: string, rootPath: string): boolean {
  return isPathInsideRoot(candidatePath, rootPath);
}

export function resolveFileSystemEntry(entryPath: string): FileSystemEntryInfo | undefined {
  try {
    const logicalPath = path.resolve(entryPath);
    const linkStat = fs.lstatSync(logicalPath);
    const resolvedStat = linkStat.isSymbolicLink() ? fs.statSync(logicalPath) : linkStat;

    return {
      logicalPath,
      realPath: getRealPathSafe(logicalPath),
      isDirectory: resolvedStat.isDirectory(),
      isFile: resolvedStat.isFile(),
      isSymbolicLink: linkStat.isSymbolicLink()
    };
  } catch {
    return undefined;
  }
}