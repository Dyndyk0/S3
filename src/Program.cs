using Minio;
using Microsoft.EntityFrameworkCore;
using XPEHb.Services;
using Swashbuckle.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

string minioEndpoint = Environment.GetEnvironmentVariable("MINIO_HOST") + ":" + Environment.GetEnvironmentVariable("MINIO_PORT");

builder.Services.AddDbContext<XPEHb.Models.Entities.MetaContext>(options => options.UseNpgsql(Environment.GetEnvironmentVariable("HOST_STRING")));

builder.Services.AddMinio(options => {
    options.WithEndpoint(minioEndpoint);
    options.WithCredentials(Environment.GetEnvironmentVariable("MINIO_USER"), Environment.GetEnvironmentVariable("MINIO_PASSWORD"));
    //options.WithCredentials(Environment.GetEnvironmentVariable("ACCESS_KEY"), Environment.GetEnvironmentVariable("SECRET_KEY"));
    options.WithSSL(false);
});

builder.Services.AddScoped<MinioService>();
builder.Services.AddScoped<TemplateService>();
builder.Services.AddScoped<ValueMetadataService>();
builder.Services.AddScoped<KeyMetadataService>();
builder.Services.AddScoped<FileService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

app.MapFileEndpoints(minioEndpoint);
app.MapTemplateEndpoints();
app.MapKeyMetadataEndpoints();
app.MapValueMetadataEndpoints();
app.MapMinioEndpoints();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI();

app.MapFallbackToFile("index.html");

app.Run();