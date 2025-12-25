/**
 * Template Engine Module
 * Parses template variables and orchestrates their resolution.
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Regex pattern for detecting template variables
 * Matches patterns like {VARIABLE_NAME} where name is uppercase letters and underscores
 */
const VARIABLE_PATTERN = /\{([A-Z_]+)\}/g;

/**
 * Built-in variable names
 */
const BUILTIN_VARIABLES = {
	FILENAME: 'FILENAME',
	FILEPATH: 'FILEPATH',
	SELECTION: 'SELECTION',
	CLIPBOARD: 'CLIPBOARD',
	LINE: 'LINE',
	TASK: 'TASK',
} as const;

/**
 * Interface for a variable resolver
 * Each resolver is responsible for resolving a specific variable name
 */
export interface VariableResolver {
	/** The variable name this resolver handles (e.g., "FILENAME") */
	name: string;
	/** Async function that resolves the variable value, returns undefined if cannot resolve */
	resolve: () => Promise<string | undefined>;
}

/**
 * Registry of variable resolvers keyed by variable name
 */
const resolverRegistry = new Map<string, VariableResolver>();

/**
 * Parse all variable names from a template string
 * @param content The template content to parse
 * @returns Array of unique variable names found in the template
 */
export function parseVariables(content: string): string[] {
	const variables: string[] = [];
	const seen = new Set<string>();
	
	// Reset regex lastIndex for fresh matching
	const pattern = new RegExp(VARIABLE_PATTERN.source, VARIABLE_PATTERN.flags);
	
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(content)) !== null) {
		const variableName = match[1];
		// Only add unique variable names
		if (!seen.has(variableName)) {
			seen.add(variableName);
			variables.push(variableName);
		}
	}
	
	return variables;
}

/**
 * Register a variable resolver
 * @param resolver The resolver to register
 */
export function registerResolver(resolver: VariableResolver): void {
	resolverRegistry.set(resolver.name, resolver);
}

/**
 * Unregister a variable resolver
 * @param name The name of the resolver to remove
 */
export function unregisterResolver(name: string): void {
	resolverRegistry.delete(name);
}

/**
 * Get a registered resolver by name
 * @param name The variable name to look up
 * @returns The resolver if found, undefined otherwise
 */
export function getResolver(name: string): VariableResolver | undefined {
	return resolverRegistry.get(name);
}

/**
 * Clear all registered resolvers
 */
export function clearResolvers(): void {
	resolverRegistry.clear();
}

/**
 * Callback type for handling unresolved variables
 * Used when a variable cannot be auto-resolved and needs manual input
 * @param variableName The name of the variable that needs resolution
 * @returns The value to use, or undefined if user cancels
 */
export type UnresolvedVariableHandler = (variableName: string) => Promise<string | undefined>;

/**
 * Resolve all variables in a template string
 * @param content The template content with variables
 * @param onUnresolved Optional callback for handling variables that cannot be auto-resolved
 * @returns The resolved template content
 */
export async function resolveTemplate(
	content: string,
	onUnresolved?: UnresolvedVariableHandler
): Promise<string> {
	// If no variables, return content as-is
	const variableNames = parseVariables(content);
	if (variableNames.length === 0) {
		return content;
	}
	
	// Resolve each unique variable once
	const resolvedValues = new Map<string, string>();
	
	for (const variableName of variableNames) {
		let value: string | undefined;
		
		// Try to find a registered resolver for this variable
		const resolver = resolverRegistry.get(variableName);
		if (resolver) {
			value = await resolver.resolve();
		}
		
		// If not resolved and we have an unresolved handler, use it
		if (value === undefined && onUnresolved) {
			value = await onUnresolved(variableName);
		}
		
		// If still undefined after all attempts, user cancelled - stop processing
		if (value === undefined) {
			throw new VariableResolutionCancelled(variableName);
		}
		
		resolvedValues.set(variableName, value);
	}
	
	// Replace all occurrences of each variable
	let result = content;
	for (const [variableName, value] of resolvedValues) {
		// Create a pattern for this specific variable
		const variablePattern = new RegExp(`\\{${variableName}\\}`, 'g');
		// Use function replacement to avoid special character interpretation
		// (e.g., $&, $$, $1, etc. in the replacement string)
		result = result.replace(variablePattern, () => value);
	}
	
	return result;
}

/**
 * Error thrown when variable resolution is cancelled by the user
 */
export class VariableResolutionCancelled extends Error {
	/** The variable that was being resolved when cancelled */
	public readonly variableName: string;
	
	constructor(variableName: string) {
		super(`Variable resolution cancelled for: ${variableName}`);
		this.name = 'VariableResolutionCancelled';
		this.variableName = variableName;
	}
}

/**
 * Default handler for unresolved variables - prompts user for input via VS Code input box
 * @param variableName The name of the variable that needs a value
 * @returns The user-provided value, or undefined if cancelled
 */
export async function promptForVariable(variableName: string): Promise<string | undefined> {
	return await vscode.window.showInputBox({
		prompt: `Enter value for {${variableName}}`,
		placeHolder: variableName,
		ignoreFocusOut: true,
	});
}

// ============================================================================
// Built-in Variable Resolvers
// ============================================================================

/**
 * Resolve FILENAME variable - returns current file name (basename only)
 * @returns The file name, or undefined if no active editor
 */
async function resolveFilename(): Promise<string | undefined> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return undefined;
	}
	return path.basename(editor.document.fileName);
}

/**
 * Resolve FILEPATH variable - returns full file path
 * @returns The full file path, or undefined if no active editor
 */
async function resolveFilepath(): Promise<string | undefined> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return undefined;
	}
	return editor.document.uri.fsPath;
}

/**
 * Resolve SELECTION variable - returns currently selected text
 * @returns The selected text (empty string if no selection), or undefined if no active editor
 */
async function resolveSelection(): Promise<string | undefined> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return undefined;
	}
	// Return empty string if no selection, not undefined
	// This allows templates with {SELECTION} to still work when nothing is selected
	return editor.document.getText(editor.selection);
}

/**
 * Resolve CLIPBOARD variable - returns current clipboard content
 * @returns The clipboard content
 */
async function resolveClipboard(): Promise<string | undefined> {
	return await vscode.env.clipboard.readText();
}

/**
 * Resolve LINE variable - returns current line number (1-indexed)
 * @returns The line number as a string, or undefined if no active editor
 */
async function resolveLine(): Promise<string | undefined> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return undefined;
	}
	// VS Code lines are 0-indexed, add 1 for human-readable line number
	return (editor.selection.active.line + 1).toString();
}

/**
 * Resolve TASK variable - extracts task ID from open task files
 * Scans visible editors for files matching docs/delivery/*-*.md pattern
 * @returns The task ID (e.g., "1-3"), or undefined if no task file found
 */
async function resolveTask(): Promise<string | undefined> {
	const TASK_FILE_PATTERN = /^(\d+-\d+)\.md$/;
	const DELIVERY_PATH_PATTERN = /[/\\]docs[/\\]delivery[/\\]/;
	
	// Get all visible editors
	const visibleEditors = vscode.window.visibleTextEditors;
	
	// Filter for task files
	const taskEditors = visibleEditors.filter(editor => {
		const filePath = editor.document.uri.fsPath;
		const fileName = path.basename(filePath);
		return DELIVERY_PATH_PATTERN.test(filePath) && TASK_FILE_PATTERN.test(fileName);
	});
	
	if (taskEditors.length === 0) {
		return undefined;
	}
	
	// Prefer active editor if it's a task file
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const activeMatch = taskEditors.find(e => e === activeEditor);
		if (activeMatch) {
			const fileName = path.basename(activeMatch.document.uri.fsPath);
			const match = fileName.match(TASK_FILE_PATTERN);
			return match ? match[1] : undefined;
		}
	}
	
	// Otherwise use the first matching editor
	const fileName = path.basename(taskEditors[0].document.uri.fsPath);
	const match = fileName.match(TASK_FILE_PATTERN);
	return match ? match[1] : undefined;
}

/**
 * Register all built-in variable resolvers
 * Should be called during extension activation
 */
export function registerBuiltinResolvers(): void {
	registerResolver({
		name: BUILTIN_VARIABLES.FILENAME,
		resolve: resolveFilename,
	});
	
	registerResolver({
		name: BUILTIN_VARIABLES.FILEPATH,
		resolve: resolveFilepath,
	});
	
	registerResolver({
		name: BUILTIN_VARIABLES.SELECTION,
		resolve: resolveSelection,
	});
	
	registerResolver({
		name: BUILTIN_VARIABLES.CLIPBOARD,
		resolve: resolveClipboard,
	});
	
	registerResolver({
		name: BUILTIN_VARIABLES.LINE,
		resolve: resolveLine,
	});
	
	registerResolver({
		name: BUILTIN_VARIABLES.TASK,
		resolve: resolveTask,
	});
}


