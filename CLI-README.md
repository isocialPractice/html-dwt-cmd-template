# Dreamweaver Template CLI Tool

A command-line tool for managing Dreamweaver-style HTML templates without requiring VS Code or Dreamweaver.

## Features

- ✅ Update all HTML files based on template changes
- ✅ Preserve editable regions while updating non-editable content
- ✅ Automatic backup creation before updates
- ✅ Pattern-based file discovery (supports `**/*.{html,htm,php}`)
- ✅ Clean exit, no hanging processes

## Installation

```bash
npm install
npm run compile
```

## Usage

### Update All Template Instances

```bash
cd your-site-directory
node path\to\out\cli.js update-all Templates\yourtemplate.dwt --auto-apply
```

### Get Help

```bash
node path\to\out\cli.js --help
```

## Command Reference

### `update-all <template-path>`

Updates all HTML files that reference the specified template.

**Options:**

- `--auto-apply` - Apply changes without prompting (required for non-interactive use)
- `--cwd <path>` - Set working directory (defaults to current directory)

**Example:**

```bash
node ..\out\cli.js update-all Templates\page.dwt --auto-apply
```

**What it does:**

1. Scans site directory for HTML files using the specified template
2. Creates backups in `.html-dwt-cmd-template-backups/`
3. Merges template changes with instance content
4. Preserves all editable regions (<!-- InstanceBeginEditable -->)
5. Updates non-editable content from template
6. Writes updated files

### Other Commands (Coming Soon)

- `sync` - Sync template with instances
- `find-instances` - Find all instances of a template
- `create-page` - Create new page from template
- `show-regions` - Display editable regions
- `restore-backup` - Restore from backup

## How It Works

The tool uses a **hybrid architecture**:

1. **Platform Abstraction Layer** - Provides file system and interaction interfaces
2. **vscode Shim** - Allows existing VS Code extension code to run in CLI mode
3. **Template Engine** - Dreamweaver-compatible HTML template merging logic

This approach preserves all the tested template merging code while enabling CLI operation.

## Template Format

Templates use Dreamweaver's format:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- TemplateBeginEditable name="head" -->
  <title>Page Title</title>
  <!-- TemplateEndEditable -->
</head>
<body>
  <!-- TemplateBeginEditable name="main" -->
  <h1>Content goes here</h1>
  <!-- TemplateEndEditable -->
</body>
</html>
```

Instance files reference the template:

```html
<!-- InstanceBegin template="/Templates/page.dwt" -->
<!DOCTYPE html>
<html>
<head>
  <!-- InstanceBeginEditable name="head" -->
  <title>My Page</title>
  <!-- InstanceEndEditable -->
</head>
<body>
  <!-- InstanceBeginEditable name="main" -->
  <h1>My unique content</h1>
  <!-- InstanceEndEditable -->
</body>
</html>
<!-- InstanceEnd -->
```

When you update the template, the CLI tool:

- ✅ Keeps "My unique content" in the editable region
- ✅ Updates any non-editable content (like `<html>`, `<head>`, `<body>` tags)
- ✅ Preserves all editable region content exactly as-is

## File Patterns

The tool automatically:

- **Includes**: `**/*.html`, `**/*.htm`, `**/*.php`
- **Excludes**: `Templates/`, `.html-dwt-cmd-template-backups/`, `.html-dwt-template-backups/`

## Backups

Backups are created automatically in:

```
.html-dwt-cmd-template-backups/<template-name>/<version>/
```

Each run creates a new version folder, preserving previous backups.

## Exit Codes

- `0` - Success
- `1` - Error or exception
- `2` - Cancelled by user

## Requirements

- Node.js 14.0.0 or higher
- TypeScript compiler (for development)

## Troubleshooting

### CLI hangs or doesn't exit

**Fixed in current version.** The CLI now properly exits after completion.

### Template not found

Ensure the template path is relative to the site root (where you run the command).

### No instances found

Check that:

1. HTML files contain `<!-- InstanceBegin template="/Templates/yourtemplate.dwt" -->`
2. Template path matches exactly (case-sensitive)
3. Files aren't in excluded directories (Templates/, backup folders)

## Development

### Project Structure

```
src/
  cli.ts                    - CLI entry point
  cli/
    commands.ts             - Command implementations
  adapters/
    types.ts                - Platform interface definitions
    cli-adapter.ts          - CLI-specific implementations
    platform.ts             - Platform selector
  vscode-shim.ts            - VS Code compatibility layer
  setup-cli-environment.ts  - Module resolution override
  features/
    update/
      updateEngine.ts       - Template merging engine
```

### Building

```bash
npm run compile
```

### Testing

```bash
# Test with your own site
cd your-site
node path\to\out\cli.js update-all Templates\yourtemplate.dwt --auto-apply
```

## License

[Same as main project]

## See Also

- [TODO.md](TODO.md) - Architecture notes and optional enhancements
- [CODING_STANDARDS.md](CODING_STANDARDS.md) - Code style guidelines
