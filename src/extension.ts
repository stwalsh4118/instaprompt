import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// Register Add Prompt command
	const addPromptCommand = vscode.commands.registerCommand('instaprompt.addPrompt', () => {
		vscode.window.showInformationMessage('Add Prompt command - placeholder implementation');
	});

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

