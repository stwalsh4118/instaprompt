<p align="center">
  <h1 align="center">⚡ Instaprompt</h1>
  <p align="center">
    <strong>Save, manage, and instantly access AI prompts with dynamic template variables</strong>
  </p>
  <p align="center">
    A VS Code / Cursor extension for developers who work with AI assistants
  </p>
</p>

---

## ✨ Features

- **🚀 Instant Access** — Press a hotkey to open your prompt library and copy to clipboard
- **📝 Template Variables** — Auto-fill context like `{FILENAME}`, `{SELECTION}`, or `{TASK}`
- **💾 Persistent Storage** — Prompts are saved globally and available across all workspaces
- **🔍 Fuzzy Search** — Quickly filter prompts by typing in the quick pick
- **⌨️ Keyboard-First** — Designed for developers who prefer staying on the keyboard

## 📦 Installation

### From VSIX (Local)

```bash
# Build and package
pnpm install
pnpm run build
pnpm run package

# Install in VS Code
code --install-extension instaprompt-0.0.1.vsix

# Or install in Cursor
cursor --install-extension instaprompt-0.0.1.vsix
```

### From Source

```bash
git clone https://github.com/yourusername/instaprompt.git
cd instaprompt
pnpm install
pnpm run build
```

## 🎯 Usage

### Quick Start

1. **Add a prompt**: Open Command Palette (`Ctrl+Shift+P`) → `Instaprompt: Add Prompt`
2. **Select a prompt**: Press `Win+Alt+L` (or `Cmd+Alt+L` on Mac)
3. **Paste**: The prompt is now in your clipboard — paste it anywhere!

### Commands

| Command | Description | Keybinding |
|---------|-------------|------------|
| `Instaprompt: Select Prompt` | Open prompt picker and copy to clipboard | `Win+Alt+L` / `Cmd+Alt+L` |
| `Instaprompt: Add Prompt` | Create a new prompt | — |
| `Instaprompt: Edit Prompt` | Modify an existing prompt | — |
| `Instaprompt: Delete Prompt` | Remove a prompt | — |
| `Instaprompt: List Prompts` | View all saved prompts | — |

## 🔤 Template Variables

Make your prompts dynamic with template variables that auto-fill from your editor context:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{FILENAME}` | Current file name | `utils.ts` |
| `{FILEPATH}` | Full file path | `/home/user/project/src/utils.ts` |
| `{SELECTION}` | Currently selected text | `function hello() {...}` |
| `{CLIPBOARD}` | Clipboard content | (your clipboard) |
| `{LINE}` | Current line number | `42` |
| `{TASK}` | Task ID from open task files | `2-3` |
| `{CUSTOM}` | Any custom variable | Prompts for input |

### Example Prompts

**Code Review**
```
Review this code in {FILENAME} for potential bugs and improvements:

{SELECTION}
```

**Continue Task**
```
Continue working on task {TASK}. Check the task file for current status and requirements.
```

**Explain Code**
```
I'm on line {LINE} in {FILEPATH}. Explain what this code does:

{SELECTION}
```

**Custom Variable**
```
Write unit tests for the {FUNCTION_NAME} function focusing on edge cases.
```
> When `{FUNCTION_NAME}` can't be auto-resolved, you'll be prompted to enter a value.

## 🏗️ Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Compile TypeScript (for type checking)
pnpm run compile

# Build with esbuild (for packaging)
pnpm run build

# Watch mode for development
pnpm run watch
```

### Debugging

1. Open the project in VS Code/Cursor
2. Press `F5` to launch the Extension Development Host
3. Test the extension in the new window

### Packaging

```bash
# Build and package as .vsix
pnpm run package
```

## 📁 Project Structure

```
instaprompt/
├── src/
│   ├── extension.ts       # Entry point, command registration
│   ├── promptManager.ts   # CRUD operations, storage
│   ├── templateEngine.ts  # Variable parsing and resolution
│   └── types.ts           # TypeScript interfaces
├── dist/                  # Bundled output (esbuild)
├── out/                   # TypeScript output (tsc)
└── package.json           # Extension manifest
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

---

<p align="center">
  Made with ❤️ for developers who talk to AI
</p>

