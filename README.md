# ardis-adapter-poc

NestJS + TypeScript proof of concept that receives structured cutlist JSON and generates an Ardis Optimizer-compatible XML file for file-drop consumption.

## What It Does

- Exposes `POST /ardis/generate-xml`
- Validates incoming project and part data
- Maps materials from `src/mappings/materials.json`
- Maps edges from `src/mappings/edges.json`
- Generates Ardis XML without `ReportCollection`
- Saves XML output to `storage/generated/`
- Saves request/response logs to `storage/logs/`

## Project Structure

```text
src/
  app.module.ts
  main.ts
  ardis-adapter/
    ardis-adapter.controller.ts
    ardis-adapter.module.ts
    ardis-adapter.service.ts
    file-storage.service.ts
    xml-generator.service.ts
    dto/
      generate-xml.dto.ts
    types/
      ardis.types.ts
  mappings/
    materials.json
    edges.json
storage/
  generated/
  logs/
examples/
  generate-xml-request.json
```

## Prerequisites

- Node.js 20+ recommended
- npm

## Install

```bash
npm install
```

## Run Locally

```bash
npm run start:dev
```

The API starts on `http://localhost:3000`.

## Test The Endpoint

PowerShell:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/ardis/generate-xml" `
  -ContentType "application/json" `
  -InFile ".\examples\generate-xml-request.json"
```

curl:

```bash
curl -X POST http://localhost:3000/ardis/generate-xml \
  -H "Content-Type: application/json" \
  --data @examples/generate-xml-request.json
```

## Sample Request

See:

- [examples/generate-xml-request.json](examples/generate-xml-request.json)
- [examples/generate-xml-request-edge-all-sides.json](examples/generate-xml-request-edge-all-sides.json)
- [examples/generate-xml-request-two-parts.json](examples/generate-xml-request-two-parts.json)
- [examples/generate-xml-request-no-edges.json](examples/generate-xml-request-no-edges.json)
- [examples/generate-xml-request-two-materials.json](examples/generate-xml-request-two-materials.json)
- [examples/generate-xml-request-many-parts-mixed.json](examples/generate-xml-request-many-parts-mixed.json)

## Expected Response

```json
{
  "success": true,
  "projectNumber": "AT-POC-001",
  "fileName": "Project_AT-POC-001.xml",
  "generatedPath": "generated/Project_AT-POC-001.xml",
  "blobUrl": "https://<your-blob-url>/generated/Project_AT-POC-001.xml",
  "downloadUrl": "https://<your-blob-url>/generated/Project_AT-POC-001.xml?download=1",
  "logPath": "logs/AT-POC-001.json",
  "logBlobUrl": "https://<your-blob-url>/logs/AT-POC-001.json"
}
```

## Generated Files

- Blob XML output: `generated/Project_<projectNumber>.xml`
- Blob log output: `logs/<projectNumber>.json`
- Local filesystem fallback is used only when `BLOB_READ_WRITE_TOKEN` is not configured

## Output Modes

The adapter supports pluggable output delivery so it can work for local testing, Vercel Blob, or Ardis-style file drop.

- `ARDIS_OUTPUT_MODE=filesystem`
  Writes XML and logs to the filesystem only
- `ARDIS_OUTPUT_MODE=blob`
  Uploads XML and logs to Vercel Blob only
- `ARDIS_OUTPUT_MODE=both`
  Writes to filesystem and Vercel Blob in the same request
- `ARDIS_OUTPUT_MODE=auto`
  Uses Blob when `BLOB_READ_WRITE_TOKEN` is configured, otherwise filesystem

Useful filesystem paths:

- `ARDIS_FILE_DROP_PATH`
  Target folder for generated XML files, including shared/network paths
- `ARDIS_LOG_PATH`
  Target folder for generated JSON logs

Filesystem writes use a temp-file-then-rename flow so Ardis does not pick up partially written XML files.

## Validation Rules

- `projectNumber` is required
- `customerName` is required
- At least one part is required
- Each part must have `materialCode`, `lengthMm`, `widthMm`, and `quantity`
- `materialCode` must exist in `materials.json`
- Any non-empty edge code must exist in `edges.json`

## Current POC Notes

- No D365 integration yet
- Materials and edges are loaded from local JSON mapping files
- Machine settings are static for the Selco target
- `ReportCollection` is intentionally excluded
