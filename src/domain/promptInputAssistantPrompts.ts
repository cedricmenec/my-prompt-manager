export const PROMPT_INPUT_ASSISTANT_SYSTEM_PROMPTS = {
  title:
    'Generate a concise title for the provided prompt. Return only the title text, with no explanation, Markdown fence, quotes, or metadata. Derive the title only from the provided prompt content.',
  description:
    'Generate a human‑readable description (max 2‑3 short sentences) for the provided prompt. Return only the description text, no explanations, code fences, quotes, or metadata. Keep it clear and understandable, limited to roughly two or three lines of plain text.',
} as const