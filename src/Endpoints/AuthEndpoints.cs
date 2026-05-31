using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using XPEHb.Models.Entities;
using XPEHb.Models.Dtos;

namespace XPEHb.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("auth");
        group.MapPost("/login", async (LoginRequest request, MetaContext db, HttpContext httpContext) =>
        {
            IResult result = await ExternalApiCheckAsync(request.UserName, request.Password);
            if (!result.Equals(Results.Ok()))
            {
                return result;
            }

            var dbUser = await db.Users.FirstOrDefaultAsync(u => u.Name == request.UserName);

            if (dbUser == null)
            {
                dbUser = new User 
                { 
                    Name = request.UserName
                };
                db.Userroles.Add(new Userrole{ User = dbUser, RoleId = 2 });
                db.Users.Add(dbUser);
                await db.SaveChangesAsync();
            }

            var userRoles = await db.Userroles
                .Where(ur => ur.UserId == dbUser.Id)
                .Select(ur => ur.Role.Name)
                .ToListAsync();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, dbUser.Name),
                new Claim(ClaimTypes.NameIdentifier, dbUser.Id.ToString()),
                new Claim("SessionId", Guid.NewGuid().ToString())
            };

            foreach (var roleName in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, roleName));
            }

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identity);

            await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

            return Results.Ok(new { UserName = dbUser.Name });
        })
        .AllowAnonymous();

        group.MapPost("/logout", async (HttpContext httpContext) =>
        {
            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok();
        });
    }

    // Временный метод-заглушка для внешнего API
    private static Task<IResult> ExternalApiCheckAsync(string username, string password)
    {
        return Task.FromResult(Results.Ok());
    }
}