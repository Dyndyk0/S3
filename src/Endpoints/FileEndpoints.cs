using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class FileEndpoints
{
    public static void MapFileEndpoints(this IEndpointRouteBuilder app, string minioEndpoint)
    {
        var group = app.MapGroup("/api").WithTags("file");

        // GET /file
        group.MapGet("/file", async ([AsParameters] FileFilterDto filter, DbService db) => {
            var files = await db.GetFilesAsync(filter);
            return Results.Ok(files);
        });
        
        // POST /file
        group.MapPost("/file", async (FileInitDto req, MinioService storage, DbService db, HttpContext context) => {
            (int id,string link) = await db.InitFileMetadataAsync(req.FileName, req.FileExtension, req.ValueIds);

            context.Items["LogFileName"] = link; 

            string minioPutUrl = await storage.GetUploadUrlAsync(link, minioEndpoint);
            return Results.Ok(new { id, uploadUrl = minioPutUrl });
        });

        // GET /download
        group.MapGet("/file/{fileId}", async (int fileId, MinioService storage, DbService db, HttpContext context) => {
            string? fileLink = await db.GetLinkByIdAsync(fileId);
            string? fileName = await db.GetFileNameWithFileExtensionByIdAsync(fileId);
            if ((fileLink is null) || (fileName is null)) return Results.NotFound($"The file with ID {fileId} was not found");

            context.Items["LogFileName"] = fileLink; //.Replace("%", "%25") ладно

            string fullMinioUrl = await storage.GetDownloadUrlAsync(fileLink, fileName);
            var uri = new Uri(fullMinioUrl);

            var encodedFileLink = Uri.EscapeDataString(fileLink);
            //var contentDisposition = $"attachment; filename=\"{encodedFileLink}\"; filename*=UTF-8''{encodedFileLink}";

            context.Response.Headers["X-Accel-Redirect"] = $"/internal-minio{uri.PathAndQuery}";
            //context.Response.Headers["Content-Disposition"] = contentDisposition;

            return Results.Empty;
        });

        // DELETE /delete
        group.MapDelete("/delete", async (int fileId, MinioService storage, DbService db, HttpContext context) => {
            string? fileLink = await db.GetLinkByIdAsync(fileId);
            if (fileLink is null) return Results.NotFound($"The file with ID {fileId} was not found");

            context.Items["LogFileName"] = fileLink;

            await storage.RemoveFileAsync(fileLink);
            await db.DeleteFileAsync(fileLink);
            return Results.Ok("Удалено");
        });

        // PUT /file/{fileId}
        group.MapPut("/file/{fileId}", async (int fileId, FileUpdateDto req, MinioService storage, DbService db, HttpContext context) => {
            var (id, link) = await db.UpdateFileAsync(fileId, req.ValueIds, req.FileName, req.FileExtension);
            if (id == 0) return Results.NotFound($"The file with ID {fileId} was not found");
            
            context.Items["LogFileName"] = link;

            if (req.UpdateFile.GetValueOrDefault(false))
            {
                string minioPutUrl = await storage.GetUploadUrlAsync(link, minioEndpoint);
                return Results.Ok(new { id, uploadUrl = minioPutUrl });
            }
            else
            {
                return Results.Ok(id); // Зачем я возвращаю id?
            }
        });
    }
}