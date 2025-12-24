import * as vscode from 'vscode';
import { initializePromptManager, addPrompt, getPrompts, updatePrompt, deletePrompt } from './promptManager';
import { PromptUpdate } from './types';

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

export function activate(context: vscode.ExtensionContext) {
	// Initialize prompt manager with extension context
	initializePromptManager(context);

	// Register Add Prompt command
	const addPromptCommand = vscode.commands.registerCommand('instaprompt.addPrompt', handleAddPrompt);

	// Register Edit Prompt command
	const editPromptCommand = vscode.commands.registerCommand('instaprompt.editPrompt', handleEditPrompt);

	// Register Delete Prompt command
	const deletePromptCommand = vscode.commands.registerCommand('instaprompt.deletePrompt', handleDeletePrompt);

	// Register List Prompts command
	const listPromptsCommand = vscode.commands.registerCommand('instaprompt.listPrompts', handleListPrompts);

	// Add all commands to subscriptions
	context.subscriptions.push(addPromptCommand);
	context.subscriptions.push(editPromptCommand);
	context.subscriptions.push(deletePromptCommand);
	context.subscriptions.push(listPromptsCommand);
}

export function deactivate() {
	// Cleanup if needed
}

