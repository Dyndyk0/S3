using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class FileEndpoints
{
    public static void MapFileEndpoints(this IEndpointRouteBuilder app, string minioEndpoint)
    {
        //var group = app.MapGroup("/api/media").WithTags("Media");

        // GET /file
        app.MapGet("/file", async ([AsParameters] FileFilterDto filter, DbService db) => {
            var files = await db.GetFilesAsync(filter);
            return Results.Ok(files);
        });
        
        // POST /file
        app.MapPost("/file", async (FileInitDto req, MinioService storage, DbService db, HttpContext context) => {
            (int id,string link) = await db.InitFileMetadataAsync(req.FileName, req.ValueIds);

            context.Items["LogFileName"] = link; 

            string minioPutUrl = await storage.GetUploadUrlAsync(link);
            //string publicHost = $"{context.Request.Scheme}://{context.Request.Host}:8080"; // Тут порт 8080 потому, что потому (удалить позднее) (Вспомнить зачем вообще эта строчка)
            string maskedUrl = minioPutUrl.Replace($"http://{minioEndpoint}", "/minio");
            return Results.Ok(new { id, uploadUrl = maskedUrl });
        });

        // GET /download
        app.MapGet("/file/{fileId}", async (int fileId, MinioService storage, DbService db, HttpContext context) => {
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