using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class MinioEndpoints
{
    public static void MapMinioEndpoints(this IEndpointRouteBuilder app, string minioEndpoint)
    {
        // POST /uploadUrl
        app.MapPost("/uploadUrl", async (FileInitDto req, MinioService storage, DbService db, HttpContext context) => {
            string link = await db.InitFileMetadataAsync(req.FileName, req.ValueIds);

            context.Items["LogFileName"] = link; 

            string minioPutUrl = await storage.GetUploadUrlAsync(link);
            string publicHost = $"{context.Request.Scheme}://{context.Request.Host}:8080"; // Тут порт 8080 потому, что потому (удалить позднее) (Вспомнить зачем вообще эта строчка)
            string maskedUrl = minioPutUrl.Replace($"http://{minioEndpoint}", "/minio");
            return Results.Ok(maskedUrl);
        });

        // GET /download
        app.MapGet("/download", async (int fileId, MinioService storage, DbService db, HttpContext context) => {
            string? fileLink = await db.GetLinkByIdAsync(fileId);
            if (fileLink is null) return Results.NotFound($"The file with ID {fileId} was not found");

            context.Items["LogFileName"] = fileLink; //.Replace("%", "%25") ладно

            string fullMinioUrl = await storage.GetDownloadUrlAsync(fileLink);
            var uri = new Uri(fullMinioUrl);

            var encodedFileLink = Uri.EscapeDataString(fileLink);
            var contentDisposition = $"attachment; filename=\"{encodedFileLink}\"; filename*=UTF-8''{encodedFileLink}";

            context.Response.Headers["X-Accel-Redirect"] = $"/internal-minio{uri.PathAndQuery}";
            context.Response.Headers["Content-Disposition"] = contentDisposition;

            return Results.Empty;
        });

        // GET /filesMinio
        app.MapGet("/filesMinio", async (MinioService storage) => {
            var files = await storage.ListAllFilesAsync();
            return Results.Ok(files);
        });

        // DELETE /delete
        app.MapDelete("/delete", async (int fileId, MinioService storage, DbService db, HttpContext context) => {
            string? fileLink = await db.GetLinkByIdAsync(fileId);
            if (fileLink is null) return Results.NotFound($"The file with ID {fileId} was not found");

            context.Items["LogFileName"] = fileLink;

            await storage.RemoveFileAsync(fileLink);
            await db.DeleteFileAsync(fileLink);
            return Results.Ok("Удалено");
        });
    }
}