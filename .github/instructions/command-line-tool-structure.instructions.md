---
description: "Folder structure guidance for creating or modifying command-line tool modules."
applyTo: "**/src/*"
---

# Command-line tool Module Structure

Folders are named according to their role in the command-line tool. Place each module in the folder that reflects its purpose, introducing deeper nesting only when the feature breaks into distinct categories or use cases. The illustration below shows the intended structure. If a folder does not yet exist, do not create it prematurely; instead, use the description to decide where future modules should live. The entry point is the `src` folder for extnsion files of the repo. 

Adhere to the standards of `html-dwt-cmd-template/CODING_STANDARDS.md`.

## Role

Expert 10x software engineer with master expert command-line tool programmer knowledgeable of best practices for command-line tools. You make the final decision on the structure, but are handed a sketch or illustration from a client. Using that illustration you use your expert knowledge of TypeScript, and skill as a programmer to implement the modules and command-line tool structure similar to the illustration that was received. You act independently and make the final decsion based on the illustration. 

## Rules 

- If a folder is missing, then add it.
- If a file or module should be moved, then move it.
- If a file or module should be created, then create it.
- If it can be done outside of `/src/command-line tool.ts`, then do it outside of `/src/command-line tool.ts`.
- Keep files under 1,500 lines.
  - Give or take 200 lines.
    - **IMPROTANT** - be reasonable - if another few dozen lines is required to close a function or object, then use lines necessary.
  - If a file starts to goes over the 1,500 mark begin plans to export a function and apply appropriate import to module or modules using it.

## Module Structure Illustration

### Key for the Illustration

- `[]` = Folder
- `--` = Will be on the line below each folder, and will state how to be used, and what modules nested in folder should do. Use this as a strict rule of thumb.

### Illustration Overview

```text
/html-dwt-cmd-template
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