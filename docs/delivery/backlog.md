# Product Backlog

This document contains all Product Backlog Items (PBIs) for the Instaprompt VS Code Extension, ordered by priority.

**Product Requirements Document**: [View PRD](../prd.md)

## Backlog

| ID | Actor | User Story | Status | Conditions of Satisfaction (CoS) |
|----|-------|------------|--------|----------------------------------|
| 1 | User | As a user, I want to save and manage AI prompts so that I can reuse them quickly across all my workspaces | Proposed | Extension activates correctly; Prompts persist in global storage; User can add, edit, and delete prompts via quick pick commands |
| 2 | User | As a user, I want to press a hotkey and select a prompt from a dropdown so that I can quickly copy it to my clipboard | Proposed | Configurable hotkey triggers prompt picker; Selected prompt copies to clipboard; User receives confirmation notification |
| 3 | User | As a user, I want my prompts to support template variables that auto-fill from context so that my prompts are dynamic and contextual | Proposed | Variables like {FILENAME}, {SELECTION}, {TASK} resolve automatically; Unresolved variables prompt for manual input; Template syntax is intuitive |

## PBI Details

- [PBI 1: Core Prompt Management](./1/prd.md)
- [PBI 2: Quick Prompt Selection](./2/prd.md)
- [PBI 3: Template Variable Support](./3/prd.md)

## History Log

| Timestamp | PBI_ID | Event_Type | Details | User |
|-----------|--------|------------|---------|------|
| 20251223-120000 | 1 | Created | PBI created for core prompt management functionality | User |
| 20251223-120000 | 2 | Created | PBI created for quick prompt selection with hotkey | User |
| 20251223-120000 | 3 | Created | PBI created for template variable support | User |

