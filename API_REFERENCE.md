# API Reference

## General Information

- Base API prefix: `/api`
- Request and response format: JSON
- Every response includes the `X-User-Id` header.
- File-related responses include the `X-File-Name` header.

---

## Endpoints: Files

### GET /api/file

Get a list of files.

Query parameters:
- `Offset` (int, optional)
- `Limit` (int, optional)
- `DateFrom` (DateTime, optional)
- `DateTo` (DateTime, optional)
- `TagsJson` (string, optional) — JSON array of tags like `[ { "KeyId": 1, "Value": "..." } ]`
- `TagIds` (int[], optional)
- `SortBy` (string, optional)
- `SortDescending` (bool, optional, default `true`)

Response:
- 200 OK
- JSON array of file objects

### POST /api/file

Create file metadata and get an upload URL for MinIO.

Request body:
```json
{
  "FileName": "example",
  "FileExtension": "pdf",
  "ValueIds": [1, 2, 3]
}
```

Response:
- 200 OK
- JSON:
  - `id` (int)
  - `uploadUrl` (string)

### GET /api/file/{fileId}

Get a download URL for a file.

Path parameters:
- `fileId` (int)

Response:
- 200 OK
- Headers:
  - `X-Accel-Redirect`
  - `Content-Disposition`
- Empty body
- 404 Not Found if the file is not found

### PUT /api/file/{fileId}

Update a file and/or its metadata.

Path parameters:
- `fileId` (int)

Request body:
```json
{
  "FileName": "new-name",
  "FileExtension": "pdf",
  "UpdateFile": true,
  "ValueIds": [4, 5, 6]
}
```

Body fields:
- `FileName` (string?, optional)
- `FileExtension` (string?, optional)
- `UpdateFile` (bool?, optional)
- `ValueIds` (int[]?, optional)

Behavior:
- If `UpdateFile` is `true`, the service returns a new upload URL for the existing object link.
- If `UpdateFile` is missing or `false`, only metadata values are updated.

Response:
- 200 OK
- If `UpdateFile` is `true`: `{ "id": <int>, "uploadUrl": "..." }`
- If only metadata changed: `<int>`
- 404 Not Found if the file is not found

### DELETE /api/delete

Delete a file and its metadata links.

Query parameters:
- `fileId` (int)

Response:
- 200 OK
- 404 Not Found if the file is not found

---

## Endpoints: Key Metadata

### GET /api/keymetadata

Get a list of key metadata entries.

Query parameters:
- `Offset` (int, optional)
- `Limit` (int, optional)
- `Name` (string, optional)

Response:
- 200 OK
- JSON array of key metadata objects

### POST /api/keymetadata

Create a key metadata entry.

Request body form data:
- `name` (string)

Response:
- 200 OK

### PUT /api/keymetadata

Update a key metadata entry.

Request body:
```json
{
  "Id": 1,
  "Name": "New key"
}
```

Response:
- 200 OK
- 400 Bad Request if `Name` is null or empty

### DELETE /api/keymetadata

Delete a key metadata entry.

Query parameters:
- `id` (int)

Response:
- 200 OK

---

## Endpoints: Value Metadata

### GET /api/valuemetadata

Get a list of value metadata entries.

Query parameters:
- `Offset` (int, optional)
- `Limit` (int, optional)
- `KeyId` (int, optional)
- `Name` (string, optional)

Response:
- 200 OK
- JSON array of value metadata objects

### POST /api/valuemetadata

Create a value metadata entry.

Request body form data:
- `keyMetadataId` (int)
- `name` (string)

Response:
- 200 OK

### PATCH /api/valuemetadata

Update a value metadata entry.

Request body:
```json
{
  "Id": 5,
  "Name": "New value"
}
```

Response:
- 200 OK

### DELETE /api/valuemetadata

Delete a value metadata entry.

Query parameters:
- `id` (int)

Response:
- 200 OK

---

## Endpoints: Templates

### GET /api/templates

Get a list of templates.

Query parameters:
- `Name` (string, optional)
- `Offset` (int, optional)
- `Limit` (int, optional)

Response:
- 200 OK
- JSON object with:
  - `items` (array of template objects)
  - `total` (int)

### GET /api/templates/{id}

Get template details.

Path parameters:
- `id` (int)

Response:
- 200 OK
- 404 Not Found if the template is not found

### POST /api/templates

Create a template.

Request body:
```json
{
  "Name": "Template name",
  "KeyIds": [1, 2, 3]
}
```

Response:
- 201 Created
- `{ "id": <int> }`
- 400 Bad Request if `Name` is empty or `KeyIds` is empty

### PUT /api/templates/{id}

Update a template.

Path parameters:
- `id` (int)

Request body:
```json
{
  "Name": "Updated name",
  "KeyIds": [1, 4]
}
```

Response:
- 200 OK
- 404 Not Found if the template is not found
- 400 Bad Request if input is invalid

### DELETE /api/templates/{id}

Delete a template.

Path parameters:
- `id` (int)

Response:
- 200 OK
- 404 Not Found if the template is not found

---

## Endpoints: MinIO

### GET /api/filesMinio

Get a list of files in MinIO.

Response:
- 200 OK
- JSON array of MinIO file objects

### POST /api/minio-webhook

Handle MinIO upload confirmation webhook.

Request body:
- JSON object with `Records`
- Each record includes `s3.object.key`

Response:
- 200 OK
