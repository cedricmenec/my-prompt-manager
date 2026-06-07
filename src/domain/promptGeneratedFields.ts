import { PROMPT_INPUT_ASSISTANT_SYSTEM_PROMPTS } from './promptInputAssistantPrompts'

export type PromptGeneratedFieldId = 'title' | 'description'

export interface PromptGeneratedFieldDefinition {
  fieldId: PromptGeneratedFieldId
  label: string
  systemPrompt: string
  buildUserPrompt(input: { content: string }): string
  normalize(text: string): string
}

function normalizeSingleLine(text: string, maxLength: number): string {
  return text
    .trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```$/i, '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function normalizeDescription(text: string): string {
  return text
    .trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```$/i, '')
    .trim()
}

export const PROMPT_GENERATED_FIELD_DEFINITIONS: Record<PromptGeneratedFieldId, PromptGeneratedFieldDefinition> = {
  title: {
    fieldId: 'title',
    label: 'Title',
    systemPrompt: PROMPT_INPUT_ASSISTANT_SYSTEM_PROMPTS.title,
    buildUserPrompt: ({ content }) => `Prompt content:\n\n${content}`,
    normalize: (text) => normalizeSingleLine(text, 200),
  },
  description: {
    fieldId: 'description',
    label: 'Description',
    systemPrompt: PROMPT_INPUT_ASSISTANT_SYSTEM_PROMPTS.description,
    buildUserPrompt: ({ content }) => `Prompt content:\n\n${content}`,
    normalize: normalizeDescription,
  },
}

export function getPromptGeneratedFieldDefinition(fieldId: string): PromptGeneratedFieldDefinition | undefined {
  return PROMPT_GENERATED_FIELD_DEFINITIONS[fieldId as PromptGeneratedFieldId]
}