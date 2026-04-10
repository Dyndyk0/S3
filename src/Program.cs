using XPEHb.Services;
using XPEHb.Models;
using Minio;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMinio(options => {
    options.WithEndpoint(Environment.GetEnvironmentVariable("MINIO_HOST") + ":" + Environment.GetEnvironmentVariable("MINIO_PORT"));
    options.WithCredentials(Environment.GetEnvironmentVariable("MINIO_USER"), Environment.GetEnvironmentVariable("MINIO_PASSWORD"));
    options.WithCredentials(Environment.GetEnvironmentVariable("ACCESS_KEY"), Environment.GetEnvironmentVariable("SECRET_KEY"));
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

// POST /uploadUrl
// app.MapPost("/uploadUrl", async (UploadRequest req, MinioService storage, DbService db) => {
//     string uploadUrl = await storage.GetUploadUrlAsync(req.FileName);
//     var categoryIds = req.Tags?.Select(t => t.CatId).ToList() ?? new List<int>();
//     await db.SaveFileMetadataAsync(req.FileName, req.FileName, categoryIds);
//     return Results.Ok(new { uploadUrl });
// });

// POST /uploadUrl
app.MapPost("/uploadUrl", async (UploadRequest req, MinioService storage, DbService db) => {
    string internalUrl = await storage.GetUploadUrlAsync(req.FileName);
    
    var uri = new Uri(internalUrl);
    string uploadUrl = $"/minio-api{uri.PathAndQuery}";

    var categoryIds = req.Tags?.Select(t => t.CatId).ToList() ?? new List<int>();
    await db.SaveFileMetadataAsync(req.FileName, req.FileName, categoryIds);
    return Results.Ok(new { uploadUrl });
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

// GET /downloadUrl
// app.MapGet("/downloadUrl", async (string file, MinioService storage) => {
//     string url = await storage.GetDownloadUrlAsync(file);
//     return Results.Ok(new { url });
// });

app.MapGet("/downloadUrl", async (string file, MinioService storage) => {
    string internalUrl = await storage.GetDownloadUrlAsync(file);
    var uri = new Uri(internalUrl);
    string url = $"/minio-api{uri.PathAndQuery}";
    return Results.Ok(new { url });
});

// DELETE /delete
app.MapDelete("/delete", async (string file, MinioService storage, DbService db) => {
    await storage.RemoveFileAsync(file);
    await db.DeleteFileAsync(file);
    return Results.Ok("Удалено");
});

app.MapFallback(async (HttpContext context) => {
    if (File.Exists("index.html")) return Results.Content(await File.ReadAllTextAsync("index.html"), "text/html");
    return Results.NotFound();
});


app.Run();