import * as vscode from 'vscode';
import { initializePromptManager, addPrompt, getPrompts, updatePrompt, deletePrompt } from './promptManager';
import { PromptUpdate } from './types';
import { resolveTemplate, promptForVariable, VariableResolutionCancelled, registerBuiltinResolvers } from './templateEngine';

/**
 * Command handler for adding a new prompt
 */
async function handleAddPrompt(): Promise<void> {
	try {
		// Prompt for prompt name
		const name = await vscode.window.showInputBox({
			prompt: 'Enter a name for your prompt',
			placeHolder: 'e.g., Code Review Request',
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return 'Prompt name cannot be empty';
				}
				return null;
			},
		});

		// Handle cancellation
		if (name === undefined) {
			return;
		}

		// Prompt for prompt content (multiline)
		const content = await vscode.window.showInputBox({
			prompt: 'Enter the prompt content',
			placeHolder: 'Enter your prompt text here...',
			ignoreFocusOut: true,
		});

		// Handle cancellation
		if (content === undefined) {
			return;
		}

		// Save the prompt
		await addPrompt(name.trim(), content);
		vscode.window.showInformationMessage(`Prompt "${name}" added successfully`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		vscode.window.showErrorMessage(`Failed to add prompt: ${errorMessage}`);
	}
}

/**
 * Command handler for editing an existing prompt
 */
async function handleEditPrompt(): Promise<void> {
	try {
		// Get all prompts
		const prompts = getPrompts();

		// Handle empty prompt list
		if (prompts.length === 0) {
			vscode.window.showInformationMessage('No prompts available to edit. Create a prompt first using "Instaprompt: Add Prompt"');
			return;
		}

		// Show quick pick to select prompt to edit
		const promptItems: vscode.QuickPickItem[] = prompts.map(prompt => ({
			label: prompt.name,
			description: prompt.content.substring(0, 50) + (prompt.content.length > 50 ? '...' : ''),
			detail: prompt.category ? `Category: ${prompt.category}` : undefined,
		}));

		const selectedPromptItem = await vscode.window.showQuickPick(promptItems, {
			placeHolder: 'Select a prompt to edit',
		});

		// Handle cancellation
		if (selectedPromptItem === undefined) {
			return;
		}

		// Find the selected prompt
		const selectedPrompt = prompts.find(p => p.name === selectedPromptItem.label);
		if (!selectedPrompt) {
			vscode.window.showErrorMessage('Selected prompt not found');
			return;
		}

		// Show quick pick to choose what to edit
		const editOptions: vscode.QuickPickItem[] = [
			{ label: 'Name', description: 'Edit the prompt name' },
			{ label: 'Content', description: 'Edit the prompt content' },
			{ label: 'Both', description: 'Edit both name and content' },
		];

		const selectedEditOption = await vscode.window.showQuickPick(editOptions, {
			placeHolder: 'What would you like to edit?',
		});

		// Handle cancellation
		if (selectedEditOption === undefined) {
			return;
		}

		// Collect updates based on selection
		const updates: PromptUpdate = {
			updatedAt: Date.now(), // Required by type, but will be overwritten by updatePrompt
		};

		if (selectedEditOption.label === 'Name' || selectedEditOption.label === 'Both') {
			const newName = await vscode.window.showInputBox({
				prompt: 'Enter the new name for your prompt',
				value: selectedPrompt.name,
				placeHolder: 'e.g., Code Review Request',
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return 'Prompt name cannot be empty';
					}
					return null;
				},
			});

			// Handle cancellation
			if (newName === undefined) {
				return;
			}

			updates.name = newName.trim();
		}

		if (selectedEditOption.label === 'Content' || selectedEditOption.label === 'Both') {
			const newContent = await vscode.window.showInputBox({
				prompt: 'Enter the new content for your prompt',
				value: selectedPrompt.content,
				placeHolder: 'Enter your prompt text here...',
				ignoreFocusOut: true,
			});

			// Handle cancellation
			if (newContent === undefined) {
				return;
			}

			updates.content = newContent;
		}

		// Update the prompt
		const updatedPrompt = await updatePrompt(selectedPrompt.id, updates);
		if (updatedPrompt) {
			vscode.window.showInformationMessage(`Prompt "${updatedPrompt.name}" updated successfully`);
		} else {
			vscode.window.showErrorMessage('Failed to update prompt');
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		vscode.window.showErrorMessage(`Failed to edit prompt: ${errorMessage}`);
	}
}

/**
 * Command handler for deleting an existing prompt
 */
async function handleDeletePrompt(): Promise<void> {
	try {
		// Get all prompts
		const prompts = getPrompts();

		// Handle empty prompt list
		if (prompts.length === 0) {
			vscode.window.showInformationMessage('No prompts available to delete. Create a prompt first using "Instaprompt: Add Prompt"');
			return;
		}

		// Show quick pick to select prompt to delete
		const promptItems: vscode.QuickPickItem[] = prompts.map(prompt => ({
			label: prompt.name,
			description: prompt.content.substring(0, 50) + (prompt.content.length > 50 ? '...' : ''),
			detail: prompt.category ? `Category: ${prompt.category}` : undefined,
		}));

		const selectedPromptItem = await vscode.window.showQuickPick(promptItems, {
			placeHolder: 'Select a prompt to delete',
		});

		// Handle cancellation
		if (selectedPromptItem === undefined) {
			return;
		}

		// Find the selected prompt
		const selectedPrompt = prompts.find(p => p.name === selectedPromptItem.label);
		if (!selectedPrompt) {
			vscode.window.showErrorMessage('Selected prompt not found');
			return;
		}

		// Show confirmation dialog
		const confirmDelete = await vscode.window.showWarningMessage(
			`Are you sure you want to delete the prompt "${selectedPrompt.name}"?`,
			{ modal: true },
			'Yes',
			'No'
		);

		// Handle cancellation or "No"
		if (confirmDelete !== 'Yes') {
			return;
		}

		// Delete the prompt
		const deleted = await deletePrompt(selectedPrompt.id);
		if (deleted) {
			vscode.window.showInformationMessage(`Prompt "${selectedPrompt.name}" deleted successfully`);
		} else {
			vscode.window.showErrorMessage('Failed to delete prompt');
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		vscode.window.showErrorMessage(`Failed to delete prompt: ${errorMessage}`);
	}
}

/**
 * Command handler for listing all saved prompts
 */
async function handleListPrompts(): Promise<void> {
	try {
		// Get all prompts
		const prompts = getPrompts();

		// Handle empty prompt list
		if (prompts.length === 0) {
			vscode.window.showInformationMessage('No prompts saved yet. Create a prompt first using "Instaprompt: Add Prompt"');
			return;
		}

		// Format prompts for quick pick display
		const promptItems: vscode.QuickPickItem[] = prompts.map(prompt => ({
			label: prompt.name,
			description: prompt.content.substring(0, 50) + (prompt.content.length > 50 ? '...' : ''),
			detail: prompt.category ? `Category: ${prompt.category}` : undefined,
		}));

		// Show quick pick with prompt count in title
		const selectedPromptItem = await vscode.window.showQuickPick(promptItems, {
			placeHolder: 'Select a prompt to view its full content',
			title: `Instaprompt: ${prompts.length} ${prompts.length === 1 ? 'prompt' : 'prompts'} available`,
		});

		// Handle cancellation
		if (selectedPromptItem === undefined) {
			return;
		}

		// Find the selected prompt
		const selectedPrompt = prompts.find(p => p.name === selectedPromptItem.label);
		if (!selectedPrompt) {
			vscode.window.showErrorMessage('Selected prompt not found');
			return;
		}

		// Show full content in a document or information message
		// Using a document provides better viewing experience for long content
		const doc = await vscode.workspace.openTextDocument({
			content: `Prompt: ${selectedPrompt.name}\n\n${selectedPrompt.content}`,
			language: 'plaintext',
		});
		await vscode.window.showTextDocument(doc);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		vscode.window.showErrorMessage(`Failed to list prompts: ${errorMessage}`);
	}
}

/**
 * Result type for select prompt command
 */
interface SelectPromptResult {
	success: boolean;
	promptName?: string;
}

/**
 * Command handler for selecting a prompt (main quick pick command)
 * Copies selected prompt content to clipboard and returns success status (Task 2-2)
 */
async function handleSelectPrompt(): Promise<SelectPromptResult> {
	try {
		// Get all prompts
		const prompts = getPrompts();

		// Handle empty prompt list gracefully
		if (prompts.length === 0) {
			vscode.window.showInformationMessage('No prompts saved yet. Create a prompt first using "Instaprompt: Add Prompt"');
			return { success: false };
		}

		// Create QuickPickItems with name as label and truncated content as description
		const promptItems: vscode.QuickPickItem[] = prompts.map(prompt => {
			// Get first line of content for description, truncate if needed
			const firstLine = prompt.content.split('\n')[0];
			const truncatedContent = firstLine.length > 50 
				? firstLine.substring(0, 50) + '...' 
				: firstLine;

			return {
				label: prompt.name,
				description: truncatedContent,
				detail: prompt.category ? `Category: ${prompt.category}` : undefined,
			};
		});

		// Show quick pick with fuzzy filtering enabled (matchOnDescription)
		const selectedPromptItem = await vscode.window.showQuickPick(promptItems, {
			placeHolder: 'Type to search prompts...',
			matchOnDescription: true, // Enable fuzzy filtering on description (content)
		});

		// Handle cancellation
		if (selectedPromptItem === undefined) {
			return { success: false };
		}

		// Find the selected prompt
		const selectedPrompt = prompts.find(p => p.name === selectedPromptItem.label);
		if (!selectedPrompt) {
			vscode.window.showErrorMessage('Selected prompt not found');
			return { success: false };
		}

		// Resolve template variables before copying (Task 3-5)
		let resolvedContent: string;
		try {
			resolvedContent = await resolveTemplate(selectedPrompt.content, promptForVariable);
		} catch (error) {
			// Handle cancellation gracefully - user cancelled variable input
			if (error instanceof VariableResolutionCancelled) {
				// Return silently without copying anything
				return { success: false };
			}
			// Handle other resolution errors
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			vscode.window.showErrorMessage(`Failed to resolve template variables: ${errorMessage}`);
			return { success: false, promptName: selectedPrompt.name };
		}

		// Write resolved prompt content to clipboard (Task 2-2, 3-5)
		try {
			await vscode.env.clipboard.writeText(resolvedContent);
			
			// Attempt auto-paste after a brief delay to allow focus to return
			// This works reliably in text editors and may work in some input fields
			setTimeout(async () => {
				try {
					// Try the standard paste command first (works in editors)
					await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
				} catch {
					// If that fails, try a generic paste command
					try {
						await vscode.commands.executeCommand('paste');
					} catch {
						// Silently ignore - user can still paste manually
					}
				}
			}, 100);
			
			// Show success notification (Task 2-4)
			vscode.window.showInformationMessage(`Copied '${selectedPrompt.name}' to clipboard`);
			return { success: true, promptName: selectedPrompt.name };
		} catch (clipboardError) {
			// Handle clipboard write errors gracefully (Task 2-4)
			const errorMessage = clipboardError instanceof Error ? clipboardError.message : 'Unknown clipboard error';
			vscode.window.showErrorMessage(`Failed to copy prompt to clipboard: ${errorMessage}`);
			return { success: false, promptName: selectedPrompt.name };
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		vscode.window.showErrorMessage(`Failed to select prompt: ${errorMessage}`);
		return { success: false };
	}
}

export function activate(context: vscode.ExtensionContext) {
	// Initialize prompt manager with extension context
	initializePromptManager(context);

	// Register built-in template variable resolvers
	registerBuiltinResolvers();

	// Register Add Prompt command
	const addPromptCommand = vscode.commands.registerCommand('instaprompt.addPrompt', handleAddPrompt);

	// Register Edit Prompt command
	const editPromptCommand = vscode.commands.registerCommand('instaprompt.editPrompt', handleEditPrompt);

	// Register Delete Prompt command
	const deletePromptCommand = vscode.commands.registerCommand('instaprompt.deletePrompt', handleDeletePrompt);

	// Register List Prompts command
	const listPromptsCommand = vscode.commands.registerCommand('instaprompt.listPrompts', handleListPrompts);

	// Register Select Prompt command
	const selectPromptCommand = vscode.commands.registerCommand('instaprompt.selectPrompt', handleSelectPrompt);

	// Add all commands to subscriptions
	context.subscriptions.push(addPromptCommand);
	context.subscriptions.push(editPromptCommand);
	context.subscriptions.push(deletePromptCommand);
	context.subscriptions.push(listPromptsCommand);
	context.subscriptions.push(selectPromptCommand);
}

export function deactivate() {
	// Cleanup if needed
}

