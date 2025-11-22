# HTML DWT Template Command-Line Tool

Dreamweaver-style templating system as a command-line tool, including editable region preservation, automated template-to-instance sync, and diff-based safety workflows.

## Quick Start

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/isocialPractice/html-dwt-cmd-template.git
   cd html-dwt-cmd-template
   ```

2. Install dependencies and build the tool:
   ```cmd
   npm install
   npm run compile
   ```

3. Link the CLI globally (optional):
   ```cmd
   npm link
   ```

### Usage

Run from your site root directory (the directory containing a `Templates/` folder):

```cmd
# Find all pages using a template
html-dwt-cmd find-instances Templates/main.dwt

# Update all files with prompts for each change
html-dwt-cmd update-all Templates/main.dwt

# Update all files automatically without prompts
html-dwt-cmd update-all Templates/main.dwt --auto-apply

# Show editable regions in a file
html-dwt-cmd show-regions pages/index.html

# Create a new page from a template
html-dwt-cmd create-page Templates/main.dwt --output pages/new-page.html

# Restore from last backup
html-dwt-cmd restore-backup
```

If you're not in the site root directory, use `--cwd`:

```cmd
html-dwt-cmd update-all Templates/main.dwt --cwd /path/to/site
```

## Command Reference

### `sync [template]`
Synchronize a template file with its instances. For each instance file, you'll be prompted to review changes before applying.

**Example:**
```cmd
html-dwt-cmd sync Templates/main.dwt
```

### `update-all [template]`
Update all instance files using the specified template. Shows diffs and prompts for each file unless `--auto-apply` is used.

**Options:**
- `--auto-apply` / `-a` - Apply changes to all files without prompting

**Example:**
```cmd
html-dwt-cmd update-all Templates/main.dwt --auto-apply
```

### `find-instances [template]`
Find and list all HTML/PHP files that use the specified template.

**Example:**
```cmd
html-dwt-cmd find-instances Templates/main.dwt
```

### `create-page [template]`
Create a new page from a template with all editable regions ready for content.

**Options:**
- `--output` / `-o` - Path for the new page (required)

**Example:**
```cmd
html-dwt-cmd create-page Templates/main.dwt --output pages/about.html
```

### `show-regions [file]`
Display all editable regions defined in a template or instance file.

**Example:**
```cmd
html-dwt-cmd show-regions pages/index.html
```

### `restore-backup`
Restore files from the last automatic backup. Backups are created before template updates.

**Example:**
```cmd
html-dwt-cmd restore-backup
```

## Features

### Implemented
- **Template/instance synchronization** - Preserve editable content while updating template structure
- **Optional-region conversion** - Conditional blocks based on template parameters
- **Repeating-region support** - Helpers for inserting entries and managing repeated content
- **Safety checks with diffs** - Review changes before they're applied
- **Automatic backups** - Rolling backups in `.html-dwt-cmd-template-backups/`
- **Find instances** - Locate all files using a template
- **Show editable regions** - List available edit areas in any file

### Workflow
1. Edit your template file (`.dwt` in `Templates/` folder)
2. Run `html-dwt-cmd update-all Templates/yourtemplate.dwt`
3. Review the diff for each instance file
4. Choose to apply, skip, or cancel
5. Backups are automatically created before changes

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

- Rolling backups keep the last 3 versions
- Organized by template name
- Preserves folder structure
- Restore with `html-dwt-cmd restore-backup`

## Known Limitations

- Nested templates (templates based on other templates) are supported but complex
- Export/import as XML (Dreamweaver `Export/Import`) not implemented
- Visual editors for parameter configuration not available in CLI mode
- Tag-attribute bindings (`TemplateBeginEditable tag="..." attribute="..."`) limited support

## Contributing

Contributions welcome! See the spec in `.github/spec/spec-tool-html-dwt-cmd-template-extension.md` for the full roadmap.

## License

See LICENSE file for details.
