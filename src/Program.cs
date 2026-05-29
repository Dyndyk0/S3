using Minio;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using XPEHb.Services;
using XPEHb.Middlewares;
using XPEHb.Endpoints;

var builder = WebApplication.CreateBuilder(args);

string minioEndpoint = Environment.GetEnvironmentVariable("MINIO_HOST") + ":" + Environment.GetEnvironmentVariable("MINIO_PORT");

builder.Services.AddDbContext<XPEHb.Models.Entities.MetaContext>(options => options.UseNpgsql(Environment.GetEnvironmentVariable("HOST_STRING")));

builder.Services.AddMinio(options => {
    options.WithEndpoint(minioEndpoint);
    options.WithCredentials(Environment.GetEnvironmentVariable("MINIO_USER"), Environment.GetEnvironmentVariable("MINIO_PASSWORD"));
    options.WithCredentials(Environment.GetEnvironmentVariable("ACCESS_KEY"), Environment.GetEnvironmentVariable("SECRET_KEY"));
    options.WithSSL(false);
});

builder.Services.AddScoped<MinioService>();
builder.Services.AddScoped<TemplateService>();
builder.Services.AddScoped<ValueMetadataService>();
builder.Services.AddScoped<KeyMetadataService>();
builder.Services.AddScoped<FileService>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddAuthentication("MockScheme").AddScheme<AuthenticationSchemeOptions, MockAuthHandler>("MockScheme", null);

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"))
    .AddPolicy("RequireUser", policy => policy.RequireRole("User"))
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("MockPreset", new OpenApiSecurityScheme
    {
        Description = "Введите пресет для тестирования прав: 'Admin', 'User'",
        In = ParameterLocation.Header,
        Name = "X-Mock-Preset",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("MockPreset", document)] = []
    });
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapFallbackToFile("index.html").AllowAnonymous();

app.UseSwagger(); // закинул сюда, чтобы не требовалось авторизации
app.UseSwaggerUI();

app.UseAuthentication(); // всё, что ниже, требует авторизации
app.UseMiddleware<ResponseHeadersMiddleware>();
app.UseAuthorization();

app.UseExceptionHandler();

app.MapFileEndpoints(minioEndpoint);
app.MapTemplateEndpoints();
app.MapKeyMetadataEndpoints();
app.MapValueMetadataEndpoints();
app.MapMinioEndpoints();

app.Run();