# Template Engine API

Last Updated: 2025-01-XX

## Service Interfaces

### Variable Parsing

```typescript
function parseVariables(content: string): string[]
```

Parse all variable names from a template string.

- **Parameters**:
  - `content`: The template content to parse
- **Returns**: Array of unique variable names found in the template (e.g., `['FILENAME', 'SELECTION']`)
- **Pattern**: Matches `{VARIABLE_NAME}` where name is uppercase letters and underscores

### Variable Resolver Interface

```typescript
interface VariableResolver {
  /** The variable name this resolver handles (e.g., "FILENAME") */
  name: string;
  /** Async function that resolves the variable value, returns undefined if cannot resolve */
  resolve: () => Promise<string | undefined>;
}
```

### Resolver Registration

```typescript
function registerResolver(resolver: VariableResolver): void
function unregisterResolver(name: string): void
function getResolver(name: string): VariableResolver | undefined
function clearResolvers(): void
```

Manage variable resolvers in the registry.

- `registerResolver`: Register a resolver for a variable name
- `unregisterResolver`: Remove a resolver by name
- `getResolver`: Get a registered resolver by name
- `clearResolvers`: Clear all registered resolvers

### Template Resolution

```typescript
type UnresolvedVariableHandler = (
  variableName: string
) => Promise<string | undefined>;

function resolveTemplate(
  content: string,
  onUnresolved?: UnresolvedVariableHandler
): Promise<string>
```

Resolve all variables in a template string.

- **Parameters**:
  - `content`: The template content with variables (e.g., `"Review {FILENAME}"`)
  - `onUnresolved`: Optional callback for handling variables that cannot be auto-resolved
- **Returns**: The resolved template content with all variables replaced
- **Throws**: `VariableResolutionCancelled` if user cancels during resolution

### Error Handling

```typescript
class VariableResolutionCancelled extends Error {
  /** The variable that was being resolved when cancelled */
  public readonly variableName: string;
}
```

Error thrown when variable resolution is cancelled by the user.

### Default Unresolved Handler

```typescript
function promptForVariable(variableName: string): Promise<string | undefined>
```

Default handler for unresolved variables - prompts user for input via VS Code input box.

- **Parameters**:
  - `variableName`: The name of the variable that needs a value
- **Returns**: The user-provided value, or `undefined` if cancelled

### Built-in Resolvers

```typescript
function registerBuiltinResolvers(): void
```

Register all built-in variable resolvers. Should be called during extension activation.

## Built-in Variables

| Variable | Description | Resolution |
|----------|-------------|------------|
| `{FILENAME}` | Current file name (basename only) | Active editor document |
| `{FILEPATH}` | Full file path | Active editor document |
| `{SELECTION}` | Currently selected text | Active editor selection (empty string if no selection) |
| `{CLIPBOARD}` | Current clipboard content | System clipboard |
| `{LINE}` | Current line number (1-indexed) | Active editor cursor |
| `{TASK}` | Task ID from open task files | Parses `docs/delivery/*-*.md` files, prefers active editor |

## Usage Examples

### Resolve Template with Built-in Variables

```typescript
import { resolveTemplate, registerBuiltinResolvers } from './templateEngine';

// Register built-ins during activation
registerBuiltinResolvers();

// Resolve template
const resolved = await resolveTemplate(
  'Review {FILENAME} at line {LINE}',
  promptForVariable
);
// Result: "Review extension.ts at line 42"
```

### Register Custom Resolver

```typescript
import { registerResolver, VariableResolver } from './templateEngine';

const customResolver: VariableResolver = {
  name: 'CUSTOM_VAR',
  resolve: async () => {
    // Custom resolution logic
    return 'custom value';
  }
};

registerResolver(customResolver);
```

### Handle Resolution Cancellation

```typescript
import { resolveTemplate, VariableResolutionCancelled } from './templateEngine';

try {
  const resolved = await resolveTemplate(content, promptForVariable);
  // Use resolved content
} catch (error) {
  if (error instanceof VariableResolutionCancelled) {
    // User cancelled - don't copy to clipboard
    return;
  }
  throw error;
}
```

## Related APIs

- [Commands API](../extension/commands-api.md) - Uses template engine in `selectPrompt` command
- [Types API](./types-api.md) - Processes `Prompt.content` field

