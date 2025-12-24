/**
 * Core data model for a saved prompt
 */
export interface Prompt {
	/** Unique identifier (timestamp + random suffix) */
	id: string;
	/** User-friendly name for the prompt */
	name: string;
	/** The actual prompt content */
	content: string;
	/** Optional category for organization */
	category?: string;
	/** Creation timestamp (Unix epoch in milliseconds) */
	createdAt: number;
	/** Last update timestamp (Unix epoch in milliseconds) */
	updatedAt: number;
}

/**
 * Type for updating an existing prompt
 * Excludes id and createdAt (which should never change)
 */
export type PromptUpdate = Partial<Omit<Prompt, 'id' | 'createdAt'>> & {
	/** updatedAt is always set when updating */
	updatedAt: number;
};

/**
 * Type for creating a new prompt
 * Excludes id and timestamps (which are generated)
 */
export type PromptCreate = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>;

