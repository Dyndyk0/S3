using XPEHb.Services;
using XPEHb.Models;
using System.Net;
using Minio;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

string minioEndpoint = Environment.GetEnvironmentVariable("MINIO_HOST") + ":" + Environment.GetEnvironmentVariable("MINIO_PORT");

builder.Services.AddDbContext<MyDbContext>(options => options.UseNpgsql(Environment.GetEnvironmentVariable("HOST_STRING")));

builder.Services.AddMinio(options => {
    options.WithEndpoint(minioEndpoint);
    options.WithCredentials(Environment.GetEnvironmentVariable("MINIO_USER"), Environment.GetEnvironmentVariable("MINIO_PASSWORD"));
    //options.WithCredentials(Environment.GetEnvironmentVariable("ACCESS_KEY"), Environment.GetEnvironmentVariable("SECRET_KEY"));
    options.WithSSL(false);
});

builder.Services.AddScoped<MinioService>();
builder.Services.AddScoped<DbService>();

var app = builder.Build();

// Глобальный перехватчик (для логов) (возможно, в будущем перенести в отдельный файл)
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        string currentUserId = "Zaglushka"; // Заглушка
        context.Response.Headers["X-User-Id"] = currentUserId;

        if (context.Items.TryGetValue("LogFileName", out var fileNameObj) && fileNameObj is string fileName)
        {
            context.Response.Headers["X-File-Name"] = Uri.EscapeDataString(fileName);
        }

        return Task.CompletedTask;
    });

    await next(context);
});

// GET /meta-data
app.MapGet("/meta-data", async (DbService db) => {
    var (types, cats) = await db.GetMetadataAsync();
    return Results.Ok(new { types, cats });
});

// POST /uploadUrl
app.MapPost("/uploadUrl", async (FileNameWithTags req, MinioService storage, DbService db, HttpContext context) => {
    string link = await db.InitFileMetadataAsync(req.FileName, req.CategoryIds);

    context.Items["LogFileName"] = link; 

    string minioPutUrl = await storage.GetUploadUrlAsync(link);
    string publicHost = $"{context.Request.Scheme}://{context.Request.Host}:8080"; // Тут порт 8080 потому, что потому (удалить позднее) (Вспомнить зачем вообще эта строчка)
    string maskedUrl = minioPutUrl.Replace($"http://{minioEndpoint}", "/minio");
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

// POST /files (переделать в get, желательно так, чтобы не появлялось бесконечность кода)
app.MapPost("/files/search", async (FileFilterRequest filter, DbService db) => {
    var files = await db.GetFilesAsync(filter);
    return Results.Ok(files);
});

// GET /files
app.MapGet("/files", async (DbService db) => {
    var defaultFilter = new FileFilterRequest { Offset = 0, Limit = 100 };
    var files = await db.GetFilesAsync(defaultFilter);
    return Results.Ok(files);
});

// GET /filesMinio
app.MapGet("/filesMinio", async (MinioService storage) =>
{
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

app.MapFallback(async (HttpContext context) => {
    if (File.Exists("index.html")) return Results.Content(await File.ReadAllTextAsync("index.html"), "text/html");
    return Results.NotFound();
});


app.Run();