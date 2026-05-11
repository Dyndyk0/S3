using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class MinioEndpoints
{
    public static void MapMinioEndpoints(this IEndpointRouteBuilder app)
    {
        // GET /filesMinio
        app.MapGet("/filesMinio", async (MinioService storage) => {
            var files = await storage.ListAllFilesAsync();
            return Results.Ok(files);
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
    }
}