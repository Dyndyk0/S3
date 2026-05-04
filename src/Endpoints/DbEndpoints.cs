using XPEHb.Services;
using XPEHb.Models.Dtos;
using XPEHb.src.Models.Entities;

public static class DbEndpoints
{
    public static void MapDbEndpoints(this IEndpointRouteBuilder app)
    {
        //var group = app.MapGroup("/api/media").WithTags("Media");

        // GET /meta-data
        app.MapGet("/meta-data", async (DbService db) => {
            var metadata = await db.GetMetadataAsync();
            return Results.Ok(metadata);
        });

        // POST /minio-webhook
        app.MapPost("/minio-webhook", async (MinioWebhookDto payload, DbService db) => {
            
            if (payload?.Records == null || !payload.Records.Any())
                return Results.Ok();

            foreach (var record in payload.Records)
            {
                string encodedLink = record.s3.@object.key;
                string actualLink = Uri.UnescapeDataString(encodedLink);

                await db.ConfirmUploadByLinkAsync(actualLink);
                
                Console.WriteLine($"[Webhook] MinIO подтвердил загрузку файла: {actualLink}");
            }

            return Results.Ok();
        });

        // POST /types
        app.MapPost("/types", async (string name, DbService db) => {
            await db.CreateTypeAsync(name);
            return Results.Ok();
        });

        // POST /categories
        app.MapPost("/categories", async (int typeId, string name, DbService db) => {
            await db.CreateCategoryAsync(typeId, name);
            return Results.Ok();
        });

        // GET /files
        app.MapGet("/files", async ([AsParameters] FileFilterDto filter, DbService db) => {
            var files = await db.GetFilesAsync(filter);
            return Results.Ok(files);
        });
    }
}