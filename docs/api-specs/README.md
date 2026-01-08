# API Specifications Index

This directory contains API specifications for all system components, organized by domain. These specs serve as a concise reference to prevent code duplication and ensure consistency across implementation tasks.

## Organization

- **core/**: Core data models, storage, and business logic
- **extension/**: VS Code extension commands and activation
- **ui/**: User interface components (webviews, editors)

## Core APIs

- [Types API](./core/types-api.md) - Data model interfaces (Prompt, PromptUpdate, PromptCreate)
- [Prompt Manager API](./core/prompt-manager-api.md) - CRUD operations for prompt storage
- [Template Engine API](./core/template-engine-api.md) - Variable parsing and resolution system

## Extension APIs

- [Commands API](./extension/commands-api.md) - VS Code command handlers and registration

## UI APIs

- [Markdown Editor API](./ui/markdown-editor-api.md) - Webview-based markdown editor component

## Usage Guidelines

1. **Before implementing new functionality**: Check relevant spec files to see if similar functionality already exists
2. **When creating/modifying APIs**: Update the relevant spec file as part of task completion (see Section 4.6 of project policy)
3. **When starting a task**: Load only the relevant spec files based on components being modified (see Section 6.6 of project policy)

## Last Updated

2025-01-XX

