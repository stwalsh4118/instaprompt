import * as vscode from 'vscode';

/**
 * Message types sent from webview to extension
 */
interface WebviewToExtensionMessage {
	type: 'save' | 'cancel' | 'ready';
	content?: string;
}

/**
 * Message types sent from extension to webview
 */
interface ExtensionToWebviewMessage {
	type: 'loadContent';
	content: string;
}

/**
 * Options for opening the markdown editor
 */
interface MarkdownEditorOptions {
	initialContent?: string;
	promptId?: string;
	title?: string;
	onSave?: (content: string) => Promise<void>;
	onCancel?: () => void;
}

/**
 * Current webview panel instance (only one can be open at a time)
 */
let currentPanel: vscode.WebviewPanel | undefined = undefined;
let currentOptions: MarkdownEditorOptions | undefined = undefined;

/**
 * Get the webview content HTML with textarea editor and marked preview
 */
function getWebviewContent(webview: vscode.Webview, initialContent: string = ''): string {
	const markedUrl = 'https://cdn.jsdelivr.net/npm/marked@14.1.0/marked.min.js';

	// Escape initial content for embedding in HTML
	const escapedContent = initialContent
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} https://cdn.jsdelivr.net 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';">
	<title>Markdown Editor</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			height: 100vh;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.toolbar {
			display: flex;
			gap: 8px;
			padding: 8px 12px;
			border-bottom: 1px solid var(--vscode-panel-border);
			background-color: var(--vscode-editor-background);
			flex-shrink: 0;
		}

		.toolbar button {
			padding: 6px 14px;
			border: 1px solid var(--vscode-button-border, transparent);
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			cursor: pointer;
			font-size: 13px;
			border-radius: 2px;
		}

		.toolbar button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		.toolbar button.secondary {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}

		.toolbar button.secondary:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}

		.toolbar .spacer {
			flex: 1;
		}

		.toolbar .hint {
			color: var(--vscode-descriptionForeground);
			font-size: 12px;
			align-self: center;
		}

		.container {
			display: flex;
			flex: 1;
			overflow: hidden;
		}

		.editor-container {
			flex: 1;
			display: flex;
			flex-direction: column;
			border-right: 1px solid var(--vscode-panel-border);
			overflow: hidden;
		}

		#editor {
			flex: 1;
			width: 100%;
			padding: 12px;
			border: none;
			outline: none;
			resize: none;
			font-family: var(--vscode-editor-font-family);
			font-size: var(--vscode-editor-font-size);
			line-height: 1.5;
			color: var(--vscode-editor-foreground);
			background-color: var(--vscode-editor-background);
			tab-size: 4;
		}

		#editor::placeholder {
			color: var(--vscode-input-placeholderForeground);
		}

		.preview-container {
			flex: 1;
			overflow-y: auto;
			padding: 16px;
			background-color: var(--vscode-editor-background);
			text-align: left;
		}

		.preview-container h1,
		.preview-container h2,
		.preview-container h3,
		.preview-container h4,
		.preview-container h5,
		.preview-container h6 {
			margin-top: 24px;
			margin-bottom: 16px;
			font-weight: 600;
			line-height: 1.25;
		}

		.preview-container h1:first-child,
		.preview-container h2:first-child,
		.preview-container h3:first-child {
			margin-top: 0;
		}

		.preview-container h1 {
			font-size: 2em;
			border-bottom: 1px solid var(--vscode-panel-border);
			padding-bottom: 0.3em;
		}

		.preview-container h2 {
			font-size: 1.5em;
			border-bottom: 1px solid var(--vscode-panel-border);
			padding-bottom: 0.3em;
		}

		.preview-container p {
			margin-bottom: 16px;
			line-height: 1.6;
		}

		.preview-container ul,
		.preview-container ol {
			margin-bottom: 16px;
			padding-left: 30px;
		}

		.preview-container li {
			margin-bottom: 8px;
		}

		.preview-container code {
			background-color: var(--vscode-textCodeBlock-background);
			padding: 2px 4px;
			border-radius: 3px;
			font-family: var(--vscode-editor-font-family);
			font-size: 0.9em;
		}

		.preview-container pre {
			background-color: var(--vscode-textCodeBlock-background);
			padding: 16px;
			border-radius: 4px;
			overflow-x: auto;
			margin-bottom: 16px;
		}

		.preview-container pre code {
			background-color: transparent;
			padding: 0;
		}

		.preview-container blockquote {
			border-left: 4px solid var(--vscode-panel-border);
			padding-left: 16px;
			margin: 16px 0;
			color: var(--vscode-descriptionForeground);
		}

		.preview-container table {
			border-collapse: collapse;
			margin: 16px 0;
			width: 100%;
		}

		.preview-container th,
		.preview-container td {
			border: 1px solid var(--vscode-panel-border);
			padding: 8px 12px;
			text-align: left;
		}

		.preview-container th {
			background-color: var(--vscode-textBlockQuote-background);
			font-weight: 600;
		}

		.preview-container a {
			color: var(--vscode-textLink-foreground);
		}

		.preview-container a:hover {
			color: var(--vscode-textLink-activeForeground);
		}

		.empty-preview {
			color: var(--vscode-descriptionForeground);
			font-style: italic;
			text-align: center;
			margin-top: 48px;
		}

		#preview {
			text-align: left;
		}

		#preview.empty-preview {
			text-align: center;
		}
	</style>
</head>
<body>
	<div class="toolbar">
		<button id="save-btn">Save</button>
		<button id="cancel-btn" class="secondary">Cancel</button>
		<span class="spacer"></span>
		<span class="hint">Markdown supported</span>
	</div>
	<div class="container">
		<div class="editor-container">
			<textarea id="editor" placeholder="Enter your prompt content here...">${escapedContent}</textarea>
		</div>
		<div class="preview-container">
			<div id="preview" class="empty-preview">Preview will appear here...</div>
		</div>
	</div>

	<script src="${markedUrl}"></script>
	<script>
		const vscode = acquireVsCodeApi();
		const editor = document.getElementById('editor');
		const preview = document.getElementById('preview');
		const saveBtn = document.getElementById('save-btn');
		const cancelBtn = document.getElementById('cancel-btn');

		// Update preview function
		function updatePreview(text) {
			if (!text || text.trim() === '') {
				preview.className = 'empty-preview';
				preview.innerHTML = 'Preview will appear here...';
				return;
			}

			try {
				if (typeof marked !== 'undefined') {
					preview.className = '';
					preview.innerHTML = marked.parse(text, {
						breaks: true,
						gfm: true,
					});
				} else {
					preview.className = 'empty-preview';
					preview.innerHTML = 'Markdown parser not loaded';
				}
			} catch (error) {
				preview.className = 'empty-preview';
				preview.innerHTML = 'Error rendering preview';
				console.error('Preview error:', error);
			}
		}

		// Initial preview
		updatePreview(editor.value);

		// Update preview on input
		editor.addEventListener('input', function() {
			updatePreview(this.value);
		});

		// Save button
		saveBtn.addEventListener('click', function() {
			vscode.postMessage({
				type: 'save',
				content: editor.value,
			});
		});

		// Cancel button
		cancelBtn.addEventListener('click', function() {
			vscode.postMessage({
				type: 'cancel',
			});
		});

		// Keyboard shortcuts
		editor.addEventListener('keydown', function(e) {
			// Ctrl/Cmd + S to save
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				saveBtn.click();
			}
			// Escape to cancel
			if (e.key === 'Escape') {
				cancelBtn.click();
			}
			// Tab key inserts tab character
			if (e.key === 'Tab') {
				e.preventDefault();
				const start = this.selectionStart;
				const end = this.selectionEnd;
				this.value = this.value.substring(0, start) + '\\t' + this.value.substring(end);
				this.selectionStart = this.selectionEnd = start + 1;
				updatePreview(this.value);
			}
		});

		// Handle messages from extension
		window.addEventListener('message', function(event) {
			const message = event.data;
			if (message.type === 'loadContent') {
				editor.value = message.content || '';
				updatePreview(editor.value);
			}
		});

		// Notify extension that webview is ready
		vscode.postMessage({
			type: 'ready',
		});

		// Focus the editor
		editor.focus();
	</script>
</body>
</html>`;
}

/**
 * Handle messages from the webview
 */
function handleWebviewMessage(
	message: WebviewToExtensionMessage,
	panel: vscode.WebviewPanel,
	options: MarkdownEditorOptions
): void {
	switch (message.type) {
		case 'save':
			if (message.content !== undefined && options.onSave) {
				options.onSave(message.content).then(() => {
					panel.dispose();
				}).catch((error) => {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					vscode.window.showErrorMessage(`Failed to save: ${errorMessage}`);
				});
			}
			break;

		case 'cancel':
			if (options.onCancel) {
				options.onCancel();
			}
			panel.dispose();
			break;

		case 'ready':
			// Webview is ready, send initial content if provided
			if (options.initialContent !== undefined) {
				panel.webview.postMessage({
					type: 'loadContent',
					content: options.initialContent,
				} as ExtensionToWebviewMessage);
			}
			break;
	}
}

/**
 * Open the markdown editor webview panel
 * @param context Extension context
 * @param options Editor options (initial content, callbacks, etc.)
 */
export function openMarkdownEditor(
	context: vscode.ExtensionContext,
	options: MarkdownEditorOptions = {}
): void {
	const panelTitle = options.title || 'Markdown Editor';
	const columnToShowIn = vscode.window.activeTextEditor
		? vscode.window.activeTextEditor.viewColumn
		: undefined;

	// If panel already exists, reveal it
	if (currentPanel) {
		currentPanel.reveal(columnToShowIn);
		return;
	}

	// Create new panel
	const panel = vscode.window.createWebviewPanel(
		'markdownEditor',
		panelTitle,
		columnToShowIn || vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [],
		}
	);

	// Set initial webview content
	panel.webview.html = getWebviewContent(panel.webview, options.initialContent || '');

	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		(message: WebviewToExtensionMessage) => {
			handleWebviewMessage(message, panel, options);
		},
		undefined,
		context.subscriptions
	);

	// Handle panel disposal
	panel.onDidDispose(
		() => {
			currentPanel = undefined;
			currentOptions = undefined;
		},
		null,
		context.subscriptions
	);

	// Store panel and options
	currentPanel = panel;
	currentOptions = options;
}

/**
 * Close the markdown editor webview panel if it's open
 */
export function closeMarkdownEditor(): void {
	if (currentPanel) {
		currentPanel.dispose();
		currentPanel = undefined;
		currentOptions = undefined;
	}
}
