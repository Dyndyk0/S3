using Minio;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.HttpOverrides;
using System.Text;
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
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; 
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = "KES",

            ValidateAudience = true,
            ValidAudience = "ESTD",

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),

            // 2. Включаем валидацию ключа подписи
            ValidateIssuerSigningKey = true,
            
            // 3. Передаем сам секретный ключ, которым подписывался токен
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("REACT_APP_KEY") ?? "")
            )
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("RequireAdmin", policy => policy.RequireRole("admin"))
    .AddPolicy("RequireUser", policy => policy.RequireRole("user"))
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

builder.Services.AddTransient<IClaimsTransformation, LocalClaimsTransformation>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseExceptionHandler();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseSwagger(); // закинул сюда, чтобы не требовалось авторизации
app.UseSwaggerUI();

app.UseAuthentication(); // всё, что ниже, требует авторизации
app.UseMiddleware<ResponseHeadersMiddleware>();
app.UseAuthorization();

app.MapFileEndpoints(minioEndpoint);
app.MapTemplateEndpoints();
app.MapKeyMetadataEndpoints();
app.MapValueMetadataEndpoints();
app.MapMinioEndpoints();
app.MapRoleEndpoints();
app.MapUserEndpoints();
app.MapAuthEndpoints();

app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();