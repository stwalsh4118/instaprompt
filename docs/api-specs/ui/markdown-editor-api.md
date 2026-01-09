# Markdown Editor API

Last Updated: 2025-01-XX

## Service Interfaces

### Open Markdown Editor

```typescript
interface MarkdownEditorOptions {
  /** Initial markdown content */
  initialContent?: string;
  /** Prompt ID (for tracking) */
  promptId?: string;
  /** Panel title */
  title?: string;
  /** Callback when user saves */
  onSave?: (content: string) => Promise<void>;
  /** Callback when user cancels */
  onCancel?: () => void;
}

function openMarkdownEditor(
  context: vscode.ExtensionContext,
  options?: MarkdownEditorOptions
): void
```

Open a webview panel with markdown editor and live preview.

- **Parameters**:
  - `context`: Extension context for managing subscriptions
  - `options`: Editor configuration options
- **Behavior**:
  - Creates or reveals existing panel (only one can be open at a time)
  - Uses textarea for editing (simplified implementation for reliability)
  - Uses marked library for preview rendering
  - Supports VS Code theme (dark/light)
  - Live preview updates as user types

### Close Markdown Editor

```typescript
function closeMarkdownEditor(): void
```

Close the markdown editor webview panel if it's open.

## Webview Message Protocol

### Extension to Webview Messages

```typescript
interface ExtensionToWebviewMessage {
  type: 'loadContent';
  content: string;
}
```

- `loadContent`: Send initial or updated content to editor

### Webview to Extension Messages

```typescript
interface WebviewToExtensionMessage {
  type: 'save' | 'cancel' | 'ready';
  content?: string; // Present when type is 'save'
}
```

- `save`: User clicked save button, includes content
- `cancel`: User clicked cancel button
- `ready`: Webview initialized and ready to receive content

## Editor Features

- **Split View**: Editor on left, live preview on right
- **Markdown Support**: Full markdown syntax with GFM extensions
- **Theme Aware**: Automatically adapts to VS Code theme
- **Live Preview**: Content updates preview in real-time as user types
- **Toolbar**: Save and Cancel buttons
- **Keyboard Shortcuts**:
  - `Ctrl+S` / `Cmd+S`: Save
  - `Escape`: Cancel
  - `Tab`: Insert tab character

## Usage Examples

### Open Editor for New Prompt

```typescript
import { openMarkdownEditor } from './markdownEditor';

openMarkdownEditor(context, {
  title: 'Edit Prompt',
  initialContent: '# My Prompt\n\nContent here...',
  onSave: async (content) => {
    await addPrompt('My Prompt', content);
    vscode.window.showInformationMessage('Prompt saved');
  },
  onCancel: () => {
    vscode.window.showInformationMessage('Cancelled');
  }
});
```

### Open Editor for Existing Prompt

```typescript
const prompt = getPromptById(promptId);
if (prompt) {
  openMarkdownEditor(context, {
    title: `Edit: ${prompt.name}`,
    promptId: prompt.id,
    initialContent: prompt.content,
    onSave: async (content) => {
      await updatePrompt(prompt.id, {
        content,
        updatedAt: Date.now()
      });
      vscode.window.showInformationMessage('Prompt updated');
    }
  });
}
```

## Implementation Details

- **Editor**: Textarea-based editor (simplified for reliability, avoids CDN dependency issues)
- **Preview**: marked.js library with GFM extensions, loaded from jsdelivr.net CDN
- **CDN**: marked.js loaded from cdn.jsdelivr.net
- **CSP**: Content Security Policy configured for CDN resources
- **Panel Management**: Single panel instance, reused if already open
- **Note**: Originally attempted CodeMirror 6 but encountered module resolution issues with CDN loading. Textarea provides reliable functionality with live markdown preview.

## Related APIs

- [Prompt Manager API](../core/prompt-manager-api.md) - Used in save callbacks
- [Commands API](../extension/commands-api.md) - Commands may use this editor


