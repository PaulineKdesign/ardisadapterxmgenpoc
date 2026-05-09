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

See [examples/generate-xml-request.json](examples/generate-xml-request.json).

## Expected Response

```json
{
  "success": true,
  "projectNumber": "AT-POC-001",
  "fileName": "Project_AT-POC-001.xml",
  "generatedPath": "storage/generated/Project_AT-POC-001.xml"
}
```

## Generated Files

- XML output: `storage/generated/Project_<projectNumber>.xml`
- Log output: `storage/logs/<projectNumber>.json`

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

