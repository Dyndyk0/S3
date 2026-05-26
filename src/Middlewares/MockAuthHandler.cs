using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace XPEHb.Middlewares;

public class MockAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public MockAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        string? preset = null;

        string? authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            string token = authHeader.Substring("Bearer ".Length).Trim();
            preset = token switch
            {
                "super-secret-admin-token" => "Admin",
                "standard-user-token" => "User",
                _ => null
            };
        }

        // 2. Если токена нет, ищем заголовок X-Mock-Preset
        if (string.IsNullOrEmpty(preset))
        {
            preset = Request.Headers["X-Mock-Preset"].FirstOrDefault();
        }

        // 3. Или query-параметр ?preset=...
        if (string.IsNullOrEmpty(preset))
        {
            preset = Request.Query["preset"].FirstOrDefault();
        }

        if (string.IsNullOrEmpty(preset))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        // 4. Если пресет передан, наполняем правами
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, $"MockUser_{preset}"),
            new Claim("Preset", preset)
        };

        switch (preset.ToLower())
        {
            case "admin":
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
                break;
            case "user":
                claims.Add(new Claim(ClaimTypes.Role, "User"));
                break;
            default:
                return Task.FromResult(AuthenticateResult.Fail("Invalid mock preset"));
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}