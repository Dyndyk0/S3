using System.Security.Claims;

namespace XPEHb.Middlewares;

public class MockAuthMiddleware
{
    private readonly RequestDelegate _next;

    public MockAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Ищем пресет в заголовках или в query-параметрах запроса
        string? preset = context.Request.Headers["X-Mock-Preset"].FirstOrDefault();
        if (string.IsNullOrEmpty(preset))
        {
            preset = context.Request.Query["preset"].FirstOrDefault();
        }

        // Если ничего не передано, по умолчанию используем пресет "Guest"
        if (string.IsNullOrEmpty(preset))
        {
            preset = "Guest";
        }

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, $"MockUser_{preset}"),
            new Claim("Preset", preset)
        };

        // Задаем роли и разрешения (Permissions) для пресетов
        switch (preset.ToLower())
        {
            case "admin":
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
                claims.Add(new Claim("Permission", "Read"));
                claims.Add(new Claim("Permission", "Write"));
                claims.Add(new Claim("Permission", "Delete"));
                break;
                
            case "user":
                claims.Add(new Claim(ClaimTypes.Role, "User"));
                claims.Add(new Claim("Permission", "Read"));
                claims.Add(new Claim("Permission", "Write"));
                break;
                
            case "guest":
            default:
                claims.Add(new Claim(ClaimTypes.Role, "Guest"));
                claims.Add(new Claim("Permission", "Read"));
                break;
        }

        var identity = new ClaimsIdentity(claims, "MockAuthScheme");
        context.User = new ClaimsPrincipal(identity);

        await _next(context);
    }
}