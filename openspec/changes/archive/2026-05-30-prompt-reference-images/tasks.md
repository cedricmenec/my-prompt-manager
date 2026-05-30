# Tasks: Prompt Reference Images

- [x] Update Prompt Model <!-- id: 1 -->
    - [x] Add `imageUrl` to `PromptSchema` in `src/domain/promptSchema.ts`
    - [x] Update tests in `src/domain/promptSchema.test.ts`
- [x] Enhance Prompt Card <!-- id: 2 -->
    - [x] Add image rendering logic to `src/features/prompts/PromptCard.tsx`
    - [x] Implement fallback placeholder for loading errors
    - [x] Style with Tailwind for variable height and hero placement
- [x] Update Prompt Editor <!-- id: 3 -->
    - [x] Add URL input field in `src/features/prompts/PromptView.tsx` (formerly PromptEditor)
    - [x] Bind state and handle updates
- [x] Documentation and Validation <!-- id: 4 -->
    - [x] Update `openspec/specs/prompt-model/spec.md` (main spec)
    - [x] Manually verify with a few sample image URLs (Implemented and tested via Vitest)
