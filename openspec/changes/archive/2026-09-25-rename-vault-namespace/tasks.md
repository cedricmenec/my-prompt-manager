## 1. Rename package

- [x] 1.1 Update `packages/encrypted-vault/package.json` `name` to `@activarium/encrypted-vault`
- [x] 1.2 Update root `package.json` dependency to `@activarium/encrypted-vault: workspace:*`
- [x] 1.3 Update root `build:vault` script filter to `@activarium/encrypted-vault`
- [x] 1.4 Update `pnpm-lock.yaml` entry

## 2. Update app imports

- [x] 2.1 Update `src/infrastructure/vault/index.ts` imports and re-exports
- [x] 2.2 Update `src/infrastructure/vault/payload.ts` import
- [x] 2.3 Update `src/features/vault/VaultGate.tsx` import
- [x] 2.4 Update `src/features/vault/vaultComponents.test.tsx` import
- [x] 2.5 Update `src/infrastructure/db.ts` comment

## 3. Update documentation

- [x] 3.1 Update `packages/encrypted-vault/README.md`
- [x] 3.2 Update package source header comments
- [x] 3.3 Update root `README.md`
- [x] 3.4 Update `openspec/project.md` and specs

## 4. Verify

- [x] 4.1 No remaining `@byo-prompt` references outside the historical archive
- [x] 4.2 No compilation errors