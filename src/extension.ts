import * as vscode from 'vscode';
import { initializePromptManager, addPrompt } from './promptManager';

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

export function activate(context: vscode.ExtensionContext) {
	// Initialize prompt manager with extension context
	initializePromptManager(context);

	// Register Add Prompt command
	const addPromptCommand = vscode.commands.registerCommand('instaprompt.addPrompt', handleAddPrompt);

	// Register Edit Prompt command
	const editPromptCommand = vscode.commands.registerCommand('instaprompt.editPrompt', () => {
		vscode.window.showInformationMessage('Edit Prompt command - placeholder implementation');
	});

	// Register Delete Prompt command
	const deletePromptCommand = vscode.commands.registerCommand('instaprompt.deletePrompt', () => {
		vscode.window.showInformationMessage('Delete Prompt command - placeholder implementation');
	});

	// Register List Prompts command
	const listPromptsCommand = vscode.commands.registerCommand('instaprompt.listPrompts', () => {
		vscode.window.showInformationMessage('List Prompts command - placeholder implementation');
	});

	// Add all commands to subscriptions
	context.subscriptions.push(addPromptCommand);
	context.subscriptions.push(editPromptCommand);
	context.subscriptions.push(deletePromptCommand);
	context.subscriptions.push(listPromptsCommand);
}

export function deactivate() {
	// Cleanup if needed
}

