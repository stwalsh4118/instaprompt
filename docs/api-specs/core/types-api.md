# Types API

Last Updated: 2025-01-XX

## Data Contracts

### Prompt

Core data model for a saved prompt.

```typescript
interface Prompt {
  /** Unique identifier (UUID v7 - time-ordered) */
  id: string;
  /** User-friendly name for the prompt */
  name: string;
  /** The actual prompt content (may contain template variables) */
  content: string;
  /** Optional category for organization */
  category?: string;
  /** Creation timestamp (Unix epoch in milliseconds) */
  createdAt: number;
  /** Last update timestamp (Unix epoch in milliseconds) */
  updatedAt: number;
}
```

### PromptUpdate

Type for updating an existing prompt. Excludes `id` and `createdAt` (which should never change).

```typescript
type PromptUpdate = Partial<Omit<Prompt, 'id' | 'createdAt'>> & {
  /** updatedAt is always set when updating */
  updatedAt: number;
};
```

### PromptCreate

Type for creating a new prompt. Excludes `id` and timestamps (which are generated automatically).

```typescript
type PromptCreate = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>;
```

## Usage Examples

### Creating a Prompt

```typescript
const newPrompt: PromptCreate = {
  name: 'Code Review Request',
  content: 'Please review this code for potential bugs.',
  category: 'Development'
};
```

### Updating a Prompt

```typescript
const updates: PromptUpdate = {
  name: 'Updated Code Review Request',
  content: 'Please review this code for bugs and performance issues.',
  updatedAt: Date.now()
};
```

## Related APIs

- [Prompt Manager API](../core/prompt-manager-api.md) - CRUD operations using these types
- [Template Engine API](../core/template-engine-api.md) - Processes `content` field for template variables

