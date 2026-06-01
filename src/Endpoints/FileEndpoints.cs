using System.Security.Claims;
using XPEHb.Services;
using XPEHb.Models.Dtos;


namespace XPEHb.Endpoints;

public static class FileEndpoints
{
    public static void MapFileEndpoints(this IEndpointRouteBuilder app, string minioEndpoint)
    {
        var group = app.MapGroup("/api").WithTags("file");

        // GET /file
        group.MapGet("/file", async ([AsParameters] FileFilterDto filter, FileService db) => {
            var (items, total) = await db.GetFilesAsync(filter);
            return Results.Ok(new { items, total });
        });
        
        // GET /file/{id}
        group.MapGet("/file/{id}", async (int id, MinioService storage, FileService db, HttpContext context) => {
            string? fileLink = await db.GetLinkByIdAsync(id);
            string? fileName = await db.GetFileNameWithFileExtensionByIdAsync(id);
            if ((fileLink is null) || (fileName is null)) return Results.NotFound($"The file with ID {id} was not found");

            context.Items["LogFileName"] = fileLink; //.Replace("%", "%25") ладно

            string fullMinioUrl = await storage.GetDownloadUrlAsync(fileLink, fileName);
            var uri = new Uri(fullMinioUrl);

            var encodedFileLink = Uri.EscapeDataString(fileLink);
            //var contentDisposition = $"attachment; filename=\"{encodedFileLink}\"; filename*=UTF-8''{encodedFileLink}";

            context.Response.Headers["X-Accel-Redirect"] = $"/internal-minio{uri.PathAndQuery}";
            //context.Response.Headers["Content-Disposition"] = contentDisposition;

            return Results.Empty;
        });

        // POST /file
        group.MapPost("/file", async (FileInitDto req,  ClaimsPrincipal user, MinioService storage, FileService db, HttpContext context) => {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Results.Unauthorized();
            }

            (int id,string link) = await db.InitFileMetadataAsync(req.TemplateId, currentUserId, req.FileName, req.FileExtension, req.Tags);

            context.Items["LogFileName"] = link;

            string minioPutUrl = await storage.GetUploadUrlAsync(link, minioEndpoint);
            return Results.Ok(new { id, uploadUrl = minioPutUrl });
        });

        // PUT /file/{id}
        group.MapPut("/file/{id}", async (int id, FileUpdateDto req, ClaimsPrincipal user, MinioService storage, FileService db, HttpContext context) => {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int currentUserId))
            {
                return Results.Unauthorized();
            }

            var (fileId, link) = await db.UpdateFileAsync(id, currentUserId, req.TemplateId, req.Tags, req.FileName, req.FileExtension);
            if (fileId == 0) return Results.NotFound($"The file with ID {id} was not found or mark for deletion");

            context.Items["LogFileName"] = link;

            if (!req.UpdateFile.GetValueOrDefault(false))
            {
                return Results.Ok(id); // Зачем я возвращаю id?
            }

            string minioPutUrl = await storage.GetUploadUrlAsync(link, minioEndpoint);
            return Results.Ok(new { id, uploadUrl = minioPutUrl });
        });
    
        // PATCH /file/{id}
        group.MapPatch("/file/{id}", async (int id, FilePatchDto req, MinioService storage, FileService db, HttpContext context) => {
            string? fileLink = await db.MarkForDeletionAsync(id, req.IsDeleted);
            if (fileLink is null) return Results.NotFound($"The file with ID {id} was not found or already marked for deletion");
            context.Items["LogFileName"] = fileLink;
            return Results.Ok();
        });

        // DELETE /file/{id}
        group.MapDelete("/file/{id}", async (int id, MinioService storage, FileService db, HttpContext context) => {
            string? fileLink = await db.GetLinkByIdAsync(id);
            if (fileLink is null) return Results.NotFound($"The file with ID {id} was not found");

            context.Items["LogFileName"] = fileLink;

            await storage.RemoveFileAsync(fileLink);
            await db.DeleteFileAsync(fileLink);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");
    }
}