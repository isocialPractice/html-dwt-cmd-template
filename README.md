# HTML Dreamweaver Template CLI Tool

A command-line tool for managing Dreamweaver-style HTML templates without requiring VS Code or Dreamweaver. Preserve editable regions while updating template structure across your entire site.

## Features

- ✅ **Update all HTML files** based on template changes
- ✅ **Preserve editable regions** while updating non-editable content
- ✅ **Automatic backups** before every update
- ✅ **Pattern-based file discovery** (supports `**/*.{html,htm,php}`)
- ✅ **Template/instance synchronization** with diff-based safety workflows
- ✅ **Optional and repeating regions** support
- ✅ **Clean exit** - no hanging processes

## Quick Start

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/isocialPractice/html-dwt-cmd-template.git
   cd html-dwt-cmd-template
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run compile
   ```

3. (Optional) Link globally to use `html-dwt-cmd` from anywhere:
   ```bash
   npm link
   ```

### Basic Usage

Run from your site root directory (the directory containing a `Templates/` folder):

```bash
# Update all files automatically without prompts
html-dwt-cmd update-all Templates/main.dwt --auto-apply

# Update without creating backups (faster, use with version control)
html-dwt-cmd update-all Templates/main.dwt --auto-apply --no-backup

# Update with prompts for each change
html-dwt-cmd update-all Templates/main.dwt

# Find all pages using a template
html-dwt-cmd find-instances Templates/main.dwt

# Show editable regions in a file
html-dwt-cmd show-regions pages/index.html

# Get help
html-dwt-cmd --help
```

If not globally linked, use:

```bash
node out/cli.js update-all Templates/main.dwt --auto-apply
```

If you're not in the site root directory, use `--cwd`:

```bash
html-dwt-cmd update-all Templates/main.dwt --cwd /path/to/site
```

## Commands

### `update-all <template>` ⭐ Primary Command

Updates all HTML files that reference the specified template.

**Options:**
- `--auto-apply` / `-a` - Apply changes without prompting (recommended for automation)
- `--no-backup` - Skip creating backups before updates (use with caution)
- `--cwd <path>` - Set working directory (defaults to current directory)

**Examples:**
```bash
# Update with automatic backups (recommended)
html-dwt-cmd update-all Templates/page.dwt --auto-apply

# Update without creating backups (faster, but no rollback option)
html-dwt-cmd update-all Templates/page.dwt --auto-apply --no-backup
```

**What it does:**
1. Scans site directory for HTML files using the specified template
2. Creates backups in `.html-dwt-cmd-template-backups/`
3. Merges template changes with instance content
4. Preserves all editable regions (`<!-- InstanceBeginEditable -->`)
5. Updates non-editable content from template
6. Writes updated files

### `find-instances <template>`

Find and list all HTML/PHP files that use the specified template.

**Example:**
```bash
html-dwt-cmd find-instances Templates/main.dwt
```

### `show-regions <file>`

Display all editable regions defined in a template or instance file.

**Example:**
```bash
html-dwt-cmd show-regions pages/index.html
```

### Other Commands (Planned)

- `sync [template]` - Sync template with instances (with interactive prompts)
- `create-page [template]` - Create new page from template
- `restore-backup` - Restore from automatic backup

**Note:** Currently, `update-all` is the primary fully-implemented command.

## How It Works

### Workflow

1. **Edit your template** - Modify `.dwt` file in `Templates/` folder
2. **Run update command** - `html-dwt-cmd update-all Templates/yourtemplate.dwt --auto-apply`
3. **Automatic processing:**
   - Finds all instance files
   - Creates backups
   - Merges template changes
   - Preserves editable region content
   - Updates non-editable structure

### Architecture

The tool uses a **hybrid architecture** for maximum reliability:

- **Platform Abstraction Layer** - Provides file system and interaction interfaces
- **vscode Shim** - Allows existing VS Code extension code to run in CLI mode
- **Template Engine** - Dreamweaver-compatible HTML template merging logic (1400+ lines of tested code)

This approach preserves all the thoroughly-tested template merging logic while enabling CLI operation.

### File Patterns

The tool automatically:

- **Includes:** `**/*.html`, `**/*.htm`, `**/*.php`
- **Excludes:** `Templates/`, `.html-dwt-cmd-template-backups/`, `.html-dwt-template-backups/`

## Directory Structure

```
your-site/
├── Templates/
│   ├── main.dwt
│   └── secondary.dwt
├── pages/
│   ├── index.html       (instance of main.dwt)
│   └── about.html       (instance of main.dwt)
├── css/
│   └── styles.css
└── .html-dwt-cmd-template-backups/
    └── main/
        ├── 1/           (most recent backup)
        ├── 2/
        └── 3/           (oldest backup)
```

## Template Syntax

### Editable Regions
```html
<!-- TemplateBeginEditable name="content" -->
  Default content here
<!-- TemplateEndEditable -->
```

### Optional Regions
```html
<!-- TemplateParam name="showSidebar" type="boolean" value="true" -->
<!-- TemplateBeginIf cond="showSidebar" -->
  <aside>Sidebar content</aside>
<!-- TemplateEndIf -->
```

### Repeating Regions
```html
<!-- TemplateBeginRepeat name="listItems" -->
  <li>List item</li>
<!-- TemplateEndRepeat -->
```

## Backups

Backups are automatically created in `.html-dwt-cmd-template-backups/` before any template update:

- **Rolling backups** keep the last 3 versions per template
- **Organized** by template name
- **Preserves** folder structure
- **Safe** - all changes can be reverted

## Requirements

- **Node.js** 14.0.0 or higher
- **TypeScript** (for development/building)

## Troubleshooting

### Template not found

Ensure the template path is relative to the site root (where you run the command).

### No instances found

Check that:
1. HTML files contain `<!-- InstanceBegin template="/Templates/yourtemplate.dwt" -->`
2. Template path matches exactly (case-sensitive)
3. Files aren't in excluded directories (`Templates/`, backup folders)

### CLI hangs or doesn't exit

**Fixed in current version.** The CLI now properly exits after completion.

## Exit Codes

- `0` - Success
- `1` - Error or exception
- `2` - Cancelled by user

## Development

### Project Structure

```
src/
  cli.ts                    - CLI entry point
  cli/commands.ts           - Command implementations
  adapters/
    types.ts                - Platform interface definitions
    cli-adapter.ts          - CLI-specific implementations
    platform.ts             - Platform selector
  vscode-shim.ts            - VS Code compatibility layer
  setup-cli-environment.ts  - Module resolution override
  features/update/
    updateEngine.ts         - Template merging engine (core logic)
```

### Building

```bash
npm run compile
```

### Testing

```bash
cd your-test-site
node path/to/out/cli.js update-all Templates/yourtemplate.dwt --auto-apply
```

## Contributing

Contributions welcome! See [TODO.md](TODO.md) for planned enhancements and architecture notes.

## License

See [LICENSE](LICENSE) file for details.

## Documentation

- **[TODO.md](TODO.md)** - Future enhancements, architecture decisions, effort estimates
- **[CODING_STANDARDS.md](CODING_STANDARDS.md)** - Code style guidelines
