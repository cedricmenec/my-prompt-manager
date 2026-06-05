# Delta Spec: Import/Export (local image assets)

## MODIFIED Requirements

### Requirement: JSON export includes local image assets separately from prompt records
JSON export SHALL include local image asset records separately from the `prompts` array. Prompt records SHALL contain only references such as `imageAssetId` and SHALL NOT embed image binary data or base64 image data directly inside each prompt object.

Because JSON cannot represent `Blob` values directly, exported asset payloads MAY be encoded in a dedicated top-level assets section with metadata and payload data. This base64 representation is allowed only as an interchange format in the exported JSON file, not as the IndexedDB storage format or prompt record format.

#### Scenario: Export separates prompts and image assets
- **WHEN** prompts with local image assets are exported to JSON
- **THEN** prompt records contain `imageAssetId`
- **AND** the image asset payloads are present in a top-level image assets section
- **AND** prompt objects do not contain inline base64 image data

#### Scenario: Export without local assets remains valid
- **WHEN** prompts with only `imageUrl` references are exported
- **THEN** the export remains valid without requiring image asset payloads

---

### Requirement: JSON import restores local image assets and preserves legacy imageUrl
JSON import SHALL restore exported local image asset payloads into IndexedDB as `Blob` records and preserve prompt `imageAssetId` references when valid. Legacy imports that contain only `imageUrl` SHALL continue to import successfully.

#### Scenario: Import restores local asset Blob
- **WHEN** an export containing image asset payloads is imported
- **THEN** each valid payload is restored as a `Blob` in the image asset store
- **AND** prompts reference the restored asset IDs

#### Scenario: Legacy imageUrl-only import remains supported
- **WHEN** an imported file contains prompts with `imageUrl` and no local image asset payloads
- **THEN** those prompts import successfully as before

#### Scenario: Invalid asset payload is reported without rejecting valid prompts
- **WHEN** an imported file contains valid prompts and an invalid image asset payload
- **THEN** valid prompts are still returned for import
- **AND** the invalid asset is reported in import errors or warnings

---

### Requirement: Markdown/frontmatter compatibility keeps imageUrl behavior
Markdown/frontmatter import and export SHALL continue to support the existing `imageUrl` field. Markdown/frontmatter export SHALL NOT inline local image binary data into YAML frontmatter.

#### Scenario: Markdown export preserves imageUrl
- **WHEN** a prompt with `imageUrl` is exported to Markdown
- **THEN** the frontmatter includes `imageUrl` as before

#### Scenario: Markdown export omits binary local image data
- **WHEN** a prompt with a local image asset is exported to Markdown
- **THEN** no binary image payload or base64 image data is written into frontmatter
