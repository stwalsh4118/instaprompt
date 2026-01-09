# Commands API

Last Updated: 2025-01-XX

## VS Code Commands

All commands are registered in `extension.ts` during activation and use lazy activation (onCommand).

### Command Registration

```typescript
export function activate(context: vscode.ExtensionContext): void
```

Extension activation function that:
1. Initializes prompt manager with extension context
2. Registers built-in template variable resolvers
3. Registers all VS Code commands

### Command Handlers

#### instaprompt.addPrompt

Create a new prompt.

- **Handler**: `handleAddPrompt()`
- **Flow**:
  1. Prompts for prompt name (validated, cannot be empty)
  2. Opens webview markdown editor with empty content
  3. User edits content in markdown editor
  4. On save: saves prompt via `addPrompt()` and shows success notification
  5. On cancel: closes editor without saving

#### instaprompt.editPrompt

Edit an existing prompt.

- **Handler**: `handleEditPrompt()`
- **Flow**:
  1. Shows quick pick of all prompts
  2. User selects prompt to edit
  3. Shows options: Name, Content, or Both
  4. Based on selection:
     - **Name only**: Prompts for new name via input box, updates prompt
     - **Content**: Opens webview markdown editor with existing content
     - **Both**: Prompts for new name first, then opens webview editor with existing content
  5. On save: Updates prompt via `updatePrompt()` and shows success notification
  6. On cancel: Closes editor without saving

#### instaprompt.deletePrompt

Delete an existing prompt.

- **Handler**: `handleDeletePrompt()`
- **Flow**:
  1. Shows quick pick of all prompts
  2. User selects prompt to delete
  3. Shows confirmation dialog (modal)
  4. Deletes prompt via `deletePrompt()` if confirmed
  5. Shows success notification

#### instaprompt.listPrompts

List all saved prompts.

- **Handler**: `handleListPrompts()`
- **Flow**:
  1. Gets all prompts via `getPrompts()`
  2. Shows quick pick with prompt count in title
  3. User selects prompt to view
  4. Opens prompt content in a new text document

#### instaprompt.selectPrompt

Select and copy a prompt to clipboard (main command).

- **Handler**: `handleSelectPrompt()`
- **Returns**: `SelectPromptResult` with success status and optional prompt name
- **Flow**:
  1. Gets all prompts via `getPrompts()`
  2. Shows quick pick with fuzzy search (matchOnDescription enabled)
  3. User selects prompt
  4. Resolves template variables via `resolveTemplate()`
  5. Copies resolved content to clipboard
  6. Attempts auto-paste after 100ms delay
  7. Shows success notification

### Result Types

```typescript
interface SelectPromptResult {
  success: boolean;
  promptName?: string;
}
```

## Command Palette Entries

| Command ID | Title | Keybinding |
|------------|-------|------------|
| `instaprompt.selectPrompt` | Instaprompt: Select Prompt | `Ctrl+Shift+I` (configurable) |
| `instaprompt.addPrompt` | Instaprompt: Add Prompt | - |
| `instaprompt.editPrompt` | Instaprompt: Edit Prompt | - |
| `instaprompt.deletePrompt` | Instaprompt: Delete Prompt | - |
| `instaprompt.listPrompts` | Instaprompt: List Prompts | - |

## Error Handling

All command handlers:
- Catch errors and show error messages via `vscode.window.showErrorMessage()`
- Handle user cancellation gracefully (return early)
- Show informative messages for empty states

## Usage Examples

### Programmatic Command Execution

```typescript
// Execute select prompt command
const result = await vscode.commands.executeCommand<SelectPromptResult>(
  'instaprompt.selectPrompt'
);

if (result?.success) {
  console.log(`Copied prompt: ${result.promptName}`);
}
```

## Related APIs

- [Prompt Manager API](../core/prompt-manager-api.md) - Used by all commands for storage operations
- [Template Engine API](../core/template-engine-api.md) - Used by `selectPrompt` for variable resolution
- [Markdown Editor API](../ui/markdown-editor-api.md) - Used by `addPrompt` and `editPrompt` for content editing

