# Prompt Manager API

Last Updated: 2025-01-XX

## Service Interfaces

### Initialization

```typescript
function initializePromptManager(context: vscode.ExtensionContext): void
```

Initialize the prompt manager with the extension context. Must be called before using any other promptManager functions.

- **Parameters**:
  - `context`: VS Code extension context for accessing globalState
- **Throws**: None (but other functions will throw if not initialized)

### Get All Prompts

```typescript
function getPrompts(): Prompt[]
```

Get all saved prompts from storage.

- **Returns**: Array of all prompts, or empty array if none exist
- **Throws**: `Error` if prompt manager not initialized

### Get Prompt by ID

```typescript
function getPromptById(id: string): Prompt | undefined
```

Get a single prompt by its ID.

- **Parameters**:
  - `id`: The prompt ID to search for
- **Returns**: The prompt if found, `undefined` otherwise
- **Throws**: `Error` if prompt manager not initialized

### Add Prompt

```typescript
function addPrompt(
  name: string,
  content: string,
  category?: string
): Promise<Prompt>
```

Add a new prompt to storage.

- **Parameters**:
  - `name`: Prompt name (required)
  - `content`: Prompt content (required)
  - `category`: Optional category for organization
- **Returns**: The created prompt with generated `id` and timestamps
- **Throws**: `Error` if prompt manager not initialized

### Update Prompt

```typescript
function updatePrompt(
  id: string,
  updates: PromptUpdate
): Promise<Prompt | undefined>
```

Update an existing prompt.

- **Parameters**:
  - `id`: The ID of the prompt to update
  - `updates`: Partial prompt data to update (must include `updatedAt`)
- **Returns**: The updated prompt, or `undefined` if prompt not found
- **Throws**: `Error` if prompt manager not initialized

### Delete Prompt

```typescript
function deletePrompt(id: string): Promise<boolean>
```

Delete a prompt by ID.

- **Parameters**:
  - `id`: The ID of the prompt to delete
- **Returns**: `true` if prompt was deleted, `false` if not found
- **Throws**: `Error` if prompt manager not initialized

## Storage

- **Location**: VS Code `ExtensionContext.globalState`
- **Key**: `instaprompt.prompts`
- **Format**: JSON array of `Prompt` objects
- **Scope**: Global (available across all workspaces)

## Usage Examples

### Initialize and Add Prompt

```typescript
import { initializePromptManager, addPrompt } from './promptManager';

// During extension activation
initializePromptManager(context);

// Add a new prompt
const prompt = await addPrompt(
  'Code Review',
  'Please review {FILENAME} for bugs.'
);
```

### Update Prompt

```typescript
import { updatePrompt } from './promptManager';

const updated = await updatePrompt(promptId, {
  name: 'Updated Code Review',
  content: 'Please review {FILENAME} for bugs and performance.',
  updatedAt: Date.now()
});
```

### Delete Prompt

```typescript
import { deletePrompt } from './promptManager';

const deleted = await deletePrompt(promptId);
if (deleted) {
  console.log('Prompt deleted successfully');
}
```

## Related APIs

- [Types API](./types-api.md) - Data model types used by this API
- [Commands API](../extension/commands-api.md) - VS Code commands that use this API

