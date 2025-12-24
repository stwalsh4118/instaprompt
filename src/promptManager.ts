import * as vscode from 'vscode';
import { uuidv7 } from 'uuidv7';
import { Prompt, PromptCreate, PromptUpdate } from './types';

/**
 * Storage key for prompts in VS Code globalState
 */
const PROMPTS_STORAGE_KEY = 'instaprompt.prompts';

/**
 * Reference to the extension context for accessing globalState
 */
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Initialize the prompt manager with the extension context
 * Must be called before using any other promptManager functions
 */
export function initializePromptManager(context: vscode.ExtensionContext): void {
	extensionContext = context;
}

/**
 * Generate a unique ID for a prompt using UUID v7 (time-ordered UUID)
 */
function generatePromptId(): string {
	return uuidv7();
}

/**
 * Get all saved prompts from storage
 * @returns Array of all prompts, or empty array if none exist
 */
export function getPrompts(): Prompt[] {
	if (!extensionContext) {
		throw new Error('PromptManager not initialized. Call initializePromptManager() first.');
	}

	const stored = extensionContext.globalState.get<Prompt[]>(PROMPTS_STORAGE_KEY);
	return stored || [];
}

/**
 * Get a single prompt by its ID
 * @param id The prompt ID to search for
 * @returns The prompt if found, undefined otherwise
 */
export function getPromptById(id: string): Prompt | undefined {
	const prompts = getPrompts();
	return prompts.find(prompt => prompt.id === id);
}

/**
 * Add a new prompt to storage
 * @param name Prompt name
 * @param content Prompt content
 * @param category Optional category
 * @returns The created prompt
 */
export async function addPrompt(name: string, content: string, category?: string): Promise<Prompt> {
	if (!extensionContext) {
		throw new Error('PromptManager not initialized. Call initializePromptManager() first.');
	}

	const now = Date.now();
	const newPrompt: Prompt = {
		id: generatePromptId(),
		name,
		content,
		category,
		createdAt: now,
		updatedAt: now,
	};

	const prompts = getPrompts();
	prompts.push(newPrompt);

	await extensionContext.globalState.update(PROMPTS_STORAGE_KEY, prompts);
	return newPrompt;
}

/**
 * Update an existing prompt
 * @param id The ID of the prompt to update
 * @param updates Partial prompt data to update
 * @returns The updated prompt, or undefined if prompt not found
 */
export async function updatePrompt(id: string, updates: PromptUpdate): Promise<Prompt | undefined> {
	if (!extensionContext) {
		throw new Error('PromptManager not initialized. Call initializePromptManager() first.');
	}

	const prompts = getPrompts();
	const index = prompts.findIndex(prompt => prompt.id === id);

	if (index === -1) {
		return undefined;
	}

	const existingPrompt = prompts[index];
	const updatedPrompt: Prompt = {
		...existingPrompt,
		...updates,
		// Ensure updatedAt is always set to current time
		updatedAt: Date.now(),
	};

	prompts[index] = updatedPrompt;
	await extensionContext.globalState.update(PROMPTS_STORAGE_KEY, prompts);
	return updatedPrompt;
}

/**
 * Delete a prompt by ID
 * @param id The ID of the prompt to delete
 * @returns true if prompt was deleted, false if not found
 */
export async function deletePrompt(id: string): Promise<boolean> {
	if (!extensionContext) {
		throw new Error('PromptManager not initialized. Call initializePromptManager() first.');
	}

	const prompts = getPrompts();
	const index = prompts.findIndex(prompt => prompt.id === id);

	if (index === -1) {
		return false;
	}

	prompts.splice(index, 1);
	await extensionContext.globalState.update(PROMPTS_STORAGE_KEY, prompts);
	return true;
}

