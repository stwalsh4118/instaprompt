# PBI-1: Core Prompt Management

[View in Backlog](../backlog.md#user-content-1)

## Overview

This PBI establishes the foundational VS Code extension infrastructure and implements the core prompt storage and management capabilities. Users will be able to create, read, update, and delete prompts that persist globally across all workspaces.

## Problem Statement

Users frequently need to reuse AI prompts but have no convenient way to store and access them within their IDE. Currently, users must manually copy prompts from external files or remember them, which is inefficient and error-prone.

## User Stories

1. As a user, I want to install the Instaprompt extension so that I can manage my AI prompts within VS Code.
2. As a user, I want to add new prompts with a name and content so that I can save them for later use.
3. As a user, I want to edit existing prompts so that I can refine them over time.
4. As a user, I want to delete prompts I no longer need so that my prompt list stays organized.
5. As a user, I want my prompts to persist across VS Code sessions and workspaces so that I don't lose them.

## Technical Approach

### Extension Structure
```
instaprompt/
├── package.json          # Extension manifest, commands, activation events
├── src/
│   ├── extension.ts      # Entry point, command registration
│   ├── promptManager.ts  # CRUD operations for prompts
│   └── types.ts          # TypeScript interfaces
├── tsconfig.json
└── .vscodeignore
```

### Data Model
```typescript
interface Prompt {
  id: string;
  name: string;
  content: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
}
```

### Storage
- Use VS Code's `ExtensionContext.globalState` for persistent storage
- Prompts stored as JSON array under key `instaprompt.prompts`

### Commands
| Command ID | Title | Description |
|------------|-------|-------------|
| `instaprompt.addPrompt` | Instaprompt: Add Prompt | Create a new prompt |
| `instaprompt.editPrompt` | Instaprompt: Edit Prompt | Modify an existing prompt |
| `instaprompt.deletePrompt` | Instaprompt: Delete Prompt | Remove a prompt |
| `instaprompt.listPrompts` | Instaprompt: List Prompts | View all saved prompts |

## UX/UI Considerations

- Use VS Code's native Quick Pick for all prompt management interactions
- Multi-line input for prompt content using `InputBox` with multiline option
- Confirmation dialogs for destructive actions (delete)
- Clear, descriptive placeholder text in input boxes

## Acceptance Criteria

1. Extension activates on first command invocation (lazy activation)
2. User can add a prompt with name and content via quick pick
3. User can edit both name and content of existing prompts
4. User can delete prompts with confirmation
5. User can view a list of all saved prompts
6. Prompts persist after VS Code restart
7. Prompts are available across all workspaces (global storage)

## Dependencies

- VS Code Extension API (`@types/vscode`)
- TypeScript build tooling
- Node.js runtime (provided by VS Code)

## Open Questions

None at this time.

## Related Tasks

See [Tasks for PBI 1](./tasks.md)

