# PBI-4: Markdown Prompt Support

[View in Backlog](../backlog.md#user-content-4)

## Overview

This PBI adds markdown support to prompts, enabling users to create and edit prompts with rich formatting using a webview editor with live preview. Users can also export prompts as markdown files and import existing markdown files as prompts. Markdown formatting is preserved when copying prompts to clipboard.

## Problem Statement

Current prompts are plain text only, limiting users' ability to format their prompts with headers, lists, code blocks, and emphasis. Users also cannot easily share prompts or back them up as files. When copying prompts, formatting information is lost.

## User Stories

1. As a user, I want to edit prompts in a markdown editor with live preview so that I can see how my formatting will appear.
2. As a user, I want to use markdown syntax (headers, lists, code blocks, bold, italic) in my prompts so that I can create well-structured prompts.
3. As a user, I want to export my prompts as .md files so that I can back them up or share them.
4. As a user, I want to import .md files as prompts so that I can add prompts from external sources.
5. As a user, I want markdown formatting preserved when copying prompts so that I can paste formatted text into markdown-aware applications.

## Technical Approach

### Webview Markdown Editor

- **Editor Component**: Use CodeMirror 6 or Monaco Editor for markdown editing
- **Preview Component**: Use `marked` library for markdown-to-HTML rendering
- **Layout**: Split view with editor on left (50%) and preview on right (50%)
- **Communication**: Use VS Code webview message passing API for bidirectional communication
- **State Management**: Maintain editor state in webview, sync with extension on save

### Export/Import Functionality

- **Export**: Use VS Code's `vscode.window.showSaveDialog` to select save location
- **Import**: Use VS Code's `vscode.window.showOpenDialog` to select .md files
- **File Format**: Standard markdown files with optional frontmatter for metadata
- **Batch Operations**: Support exporting/importing multiple prompts

### Storage

- No changes to existing storage model - `content` field stores markdown as string
- Backward compatible - existing plain text prompts continue to work
- Markdown is just string content, no schema changes needed

### Clipboard Behavior

- Current implementation already preserves raw markdown (no changes needed)
- Verify that `vscode.env.clipboard.writeText()` preserves markdown syntax
- Document that markdown syntax is copied as-is

## UX/UI Considerations

### Webview Editor

- **Save Button**: Prominent save button in webview toolbar
- **Cancel Button**: Cancel button to discard changes
- **Auto-save**: Consider auto-save on blur (optional enhancement)
- **Keyboard Shortcuts**: Support standard editor shortcuts (Ctrl+S to save)
- **Responsive**: Editor and preview resize together

### Export/Import

- **Export Dialog**: Show prompt name as default filename
- **Import Dialog**: Allow selecting multiple files
- **Success Feedback**: Show notification after successful export/import
- **Error Handling**: Clear error messages for file operation failures

### Integration Points

- **Add Prompt**: Open webview editor instead of input box
- **Edit Prompt**: Open webview editor with existing content pre-filled
- **List Prompts**: Show markdown preview in quick pick (optional enhancement)

## Acceptance Criteria

1. User can create new prompts using webview markdown editor with live preview
2. User can edit existing prompts using webview markdown editor with live preview
3. User can save changes from webview editor
4. User can cancel editing without saving changes
5. User can export one or more prompts as .md files to filesystem
6. User can import .md files as new prompts
7. When copying prompts to clipboard, markdown syntax is preserved (e.g., `**bold**` stays as `**bold**`)
8. Existing plain text prompts continue to work without modification
9. Markdown formatting renders correctly in preview pane
10. Editor supports common markdown features: headers, lists, code blocks, emphasis, links

## Dependencies

- PBI 1: Core Prompt Management (CRUD operations)
- PBI 2: Quick Prompt Selection (clipboard integration)
- PBI 3: Template Variable Support (template resolution with markdown)

## Open Questions

1. Should we support markdown preview in the quick pick list? (Deferred - can be separate enhancement)
2. Should we auto-save changes in the editor? (Deferred - manual save for now)
3. Should exported files include frontmatter metadata? (Deferred - plain markdown for now)

## Related Tasks

See [Tasks for PBI 4](./tasks.md)

