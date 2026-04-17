using XPEHb.Services;
using XPEHb.Models;
using System.Net;
using Minio;

var builder = WebApplication.CreateBuilder(args);

string minioEndpoint = Environment.GetEnvironmentVariable("MINIO_HOST") + ":" + Environment.GetEnvironmentVariable("MINIO_PORT");

builder.Services.AddMinio(options => {
    options.WithEndpoint(minioEndpoint);
    options.WithCredentials(Environment.GetEnvironmentVariable("MINIO_USER"), Environment.GetEnvironmentVariable("MINIO_PASSWORD"));
    //options.WithCredentials(Environment.GetEnvironmentVariable("ACCESS_KEY"), Environment.GetEnvironmentVariable("SECRET_KEY"));
    options.WithSSL(false);
});

builder.Services.AddScoped<MinioService>();
builder.Services.AddScoped<DbService>();

var app = builder.Build();

// GET /meta-data
app.MapGet("/meta-data", async (DbService db) => {
    var (types, cats) = await db.GetMetadataAsync();
    return Results.Ok(new { types, cats });
});

// POST /uploadUrl (Шаг "Имя файла и теги" + возврат ссылки)
app.MapPost("/uploadUrl", async (FileNameWithTags req, MinioService storage, DbService db, HttpContext context) => {
    string link = await db.InitFileMetadataAsync(req.FileName, req.CategoryIds);
    string minioPutUrl = await storage.GetUploadUrlAsync(link);
    
    string publicHost = $"{context.Request.Scheme}://{context.Request.Host}:8080"; // Тут порт 8080 потому, что потому (удалить позднее)
    string maskedUrl = minioPutUrl.Replace($"http://{minioEndpoint}", $"{Environment.GetEnvironmentVariable("SERVER_URL")}/minio");
    return Results.Ok(maskedUrl);
});

// POST /minio-webhook
app.MapPost("/minio-webhook", async (MinioWebhookPayload payload, DbService db) => {
    
    // MinIO может присылать тестовые события или события без Records
    if (payload?.Records == null || !payload.Records.Any())
        return Results.Ok();

    foreach (var record in payload.Records)
    {
        // Получаем имя загруженного файла (link)
        // Внимание: MinIO присылает URL-encoded имя (если там есть кириллица). Раскодируем:
        string encodedLink = record.s3.@object.key;
        string actualLink = Uri.UnescapeDataString(encodedLink);

        // Подтверждаем в базе
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

// GET /download
app.MapGet("/download", async (int fileId, MinioService storage, DbService db, HttpContext context) => 
{
    // Проверка пользователя
    string currentUserId = "user_123"; 

    string? fileLink = await db.GetLinkByIdAsync(fileId);
    if (fileLink is null) return Results.NotFound($"The file with ID {fileId} was not found");

    string fullMinioUrl = await storage.GetDownloadUrlAsync(fileLink);
    var uri = new Uri(fullMinioUrl);

    string internalPathAndQuery = uri.PathAndQuery;

    var encodedFileLink = Uri.EscapeDataString(fileLink);
    var contentDisposition = $"attachment; filename=\"{encodedFileLink}\"; filename*=UTF-8''{encodedFileLink}";

    context.Response.Headers["X-Accel-Redirect"] = $"/internal-minio{internalPathAndQuery}";
    context.Response.Headers["Content-Disposition"] = contentDisposition;
    context.Response.Headers["X-File-Name"] = encodedFileLink; //.Replace("%", "%25")
    context.Response.Headers["X-User-Id"] = currentUserId;

    return Results.Empty;
});

// GET /files
app.MapGet("/files", async (DbService db) => {
    var files = await db.GetFilesAsync();
    return Results.Ok(files);
});

// GET /filesMinio
app.MapGet("/filesMinio", async (MinioService storage) =>
{
    var files = await storage.ListAllFilesAsync();
    return Results.Ok(files);
});

// DELETE /delete
app.MapDelete("/delete", async (int fileId, MinioService storage, DbService db) => {
    string? fileLink = await db.GetLinkByIdAsync(fileId);
    if (fileLink is null) return Results.NotFound($"The file with ID {fileId} was not found");
    await storage.RemoveFileAsync(fileLink);
    await db.DeleteFileAsync(fileLink);
    return Results.Ok("Удалено");
});

app.MapFallback(async (HttpContext context) => {
    if (File.Exists("index.html")) return Results.Content(await File.ReadAllTextAsync("index.html"), "text/html");
    return Results.NotFound();
});


app.Run();