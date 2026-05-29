import yaml from 'js-yaml'
import { ZodError } from 'zod'
import { PromptSchema, type Prompt } from './promptSchema'

type ParseSuccess = { data: Prompt; error: null }
type ParseFailure = { data: null; error: ZodError | Error }
type ParseResult = ParseSuccess | ParseFailure

/**
 * Parses a raw Markdown string with YAML frontmatter into a Prompt.
 * Frontmatter must be delimited by `---` on its own line at the start of the file.
 */
export function parseMarkdown(raw: string): ParseResult {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return {
      data: null,
      error: new Error('No YAML frontmatter found — expected file to start with ---'),
    }
  }

  const [, frontmatterStr, body] = match

  let frontmatter: unknown
  try {
    frontmatter = yaml.load(frontmatterStr)
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
  }

  const merged = {
    ...(typeof frontmatter === 'object' && frontmatter !== null ? frontmatter : {}),
    content: body.trim(),
  }

  const result = PromptSchema.safeParse(merged)
  if (!result.success) {
    return { data: null, error: result.error }
  }

  return { data: result.data, error: null }
}

/**
 * Serializes a Prompt back to a Markdown string with YAML frontmatter.
 */
export function serializeMarkdown(prompt: Prompt): string {
  const { content, ...frontmatterFields } = prompt
  const frontmatter = yaml.dump(frontmatterFields, { lineWidth: -1 }).trimEnd()
  return `---\n${frontmatter}\n---\n${content}\n`
}
