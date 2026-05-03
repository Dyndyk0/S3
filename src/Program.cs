using Minio;
using Microsoft.EntityFrameworkCore;
using XPEHb.Services;

var builder = WebApplication.CreateBuilder(args);

string minioEndpoint = Environment.GetEnvironmentVariable("MINIO_HOST") + ":" + Environment.GetEnvironmentVariable("MINIO_PORT");

builder.Services.AddDbContext<XPEHb.src.Models.Entities.MyDbContext>(options => options.UseNpgsql(Environment.GetEnvironmentVariable("HOST_STRING")));

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

app.MapDbEndpoints();
app.MapMinioEndpoints(minioEndpoint);

app.MapGet("/", async (HttpContext context) => {
    if (File.Exists("index.html")) return Results.Content(await File.ReadAllTextAsync("index.html"), "text/html");
    return Results.NotFound();
});

app.Run();