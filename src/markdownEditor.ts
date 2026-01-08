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
 * Get the webview content HTML with CodeMirror 6 and marked library
 */
function getWebviewContent(webview: vscode.Webview, initialContent: string = ''): string {
	// CDN URLs for external libraries
	const cdnBase = 'https://cdn.jsdelivr.net';
	const codemirrorViewUrl = `${cdnBase}/npm/@codemirror/view@6.26.0/dist/index.js`;
	const codemirrorStateUrl = `${cdnBase}/npm/@codemirror/state@6.4.1/dist/index.js`;
	const codemirrorLangMarkdownUrl = `${cdnBase}/npm/@codemirror/lang-markdown@6.3.2/dist/index.js`;
	const codemirrorThemeUrl = `${cdnBase}/npm/@codemirror/theme-one-dark@6.1.2/dist/index.js`;
	const markedUrl = `${cdnBase}/npm/marked@14.1.0/marked.min.js`;

	// Escape initial content for embedding in HTML
	const escapedContent = initialContent
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\${/g, '\\${');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource} https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'; style-src ${webview.cspSource} 'unsafe-inline'; connect-src ${webview.cspSource} https://cdn.jsdelivr.net;">
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

		.preview-container {
			flex: 1;
			overflow-y: auto;
			padding: 16px;
			background-color: var(--vscode-editor-background);
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

		#editor {
			flex: 1;
			overflow: hidden;
		}

		.empty-preview {
			color: var(--vscode-descriptionForeground);
			font-style: italic;
			text-align: center;
			margin-top: 48px;
		}
	</style>
</head>
<body>
	<div class="toolbar">
		<button id="save-btn">Save</button>
		<button id="cancel-btn" class="secondary">Cancel</button>
	</div>
	<div class="container">
		<div class="editor-container">
			<div id="editor"></div>
		</div>
		<div class="preview-container">
			<div id="preview" class="empty-preview">Preview will appear here...</div>
		</div>
	</div>

	<script type="module">
		const vscode = acquireVsCodeApi();
		const editorElement = document.getElementById('editor');
		const previewElement = document.getElementById('preview');
		const saveBtn = document.getElementById('save-btn');
		const cancelBtn = document.getElementById('cancel-btn');

		let editor = null;
		let updatePreviewFn = null;

		async function initEditor() {
			try {
				// Import CodeMirror 6 modules as ES modules
				const { EditorView } = await import('${codemirrorViewUrl}');
				const { EditorState } = await import('${codemirrorStateUrl}');
				const { markdown } = await import('${codemirrorLangMarkdownUrl}');
				const { oneDark } = await import('${codemirrorThemeUrl}');
				
				// Load marked library (it's a UMD module, so we'll use it globally)
				const markedScript = document.createElement('script');
				markedScript.src = '${markedUrl}';
				await new Promise((resolve, reject) => {
					markedScript.onload = resolve;
					markedScript.onerror = reject;
					document.head.appendChild(markedScript);
				});

				// Check if VS Code theme is dark
				const isDark = document.body.classList.contains('vscode-dark') || 
				               document.body.classList.contains('vscode-high-contrast-dark');
				
				// Create editor
				editor = new EditorView({
					state: EditorState.create({
						doc: \`${escapedContent}\`,
						extensions: [
							markdown(),
							EditorView.updateListener.of((update) => {
								if (update.docChanged) {
									updatePreview(update.state.doc.toString());
								}
							}),
							EditorView.theme({
								'&': {
									height: '100%',
								},
								'.cm-content': {
									padding: '12px',
									minHeight: '100%',
									fontFamily: 'var(--vscode-editor-font-family)',
									fontSize: 'var(--vscode-editor-font-size)',
									color: 'var(--vscode-editor-foreground)',
									backgroundColor: 'var(--vscode-editor-background)',
								},
								'.cm-scroller': {
									overflow: 'auto',
								},
								'.cm-focused': {
									outline: 'none',
								},
							}),
							...(isDark ? [oneDark] : []),
						],
					}),
					parent: editorElement,
				});

				// Update preview function (needs to be accessible to message handler)
				updatePreviewFn = function(markdownText) {
					if (!markdownText || markdownText.trim() === '') {
						previewElement.innerHTML = '<div class="empty-preview">Preview will appear here...</div>';
						return;
					}

					try {
						// Use marked library (loaded globally)
						if (typeof marked !== 'undefined') {
							const html = marked.parse(markdownText, {
								breaks: true,
								gfm: true,
							});
							previewElement.innerHTML = html;
						} else {
							previewElement.innerHTML = '<div class="empty-preview">Markdown parser not loaded</div>';
						}
					} catch (error) {
						previewElement.innerHTML = '<div class="empty-preview">Error rendering preview</div>';
						console.error('Preview error:', error);
					}
				};

				// Initial preview update
				updatePreviewFn(\`${escapedContent}\`);

				// Save button handler
				saveBtn.addEventListener('click', () => {
					const content = editor.state.doc.toString();
					vscode.postMessage({
						type: 'save',
						content: content,
					});
				});

				// Cancel button handler
				cancelBtn.addEventListener('click', () => {
					vscode.postMessage({
						type: 'cancel',
					});
				});

				// Notify extension that webview is ready
				vscode.postMessage({
					type: 'ready',
				});

			} catch (error) {
				console.error('Failed to initialize editor:', error);
				previewElement.innerHTML = '<div class="empty-preview">Failed to load editor. Please refresh.</div>';
			}
		}

		// Handle messages from extension
		window.addEventListener('message', (event) => {
			const message = event.data;
			if (message.type === 'loadContent' && editor && updatePreviewFn) {
				// Update editor content if editor is already initialized
				const transaction = editor.state.update({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: message.content || '',
					},
				});
				editor.dispatch(transaction);
				// Update preview
				updatePreviewFn(message.content || '');
			}
		});

		// Initialize editor when page loads
		initEditor();
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

