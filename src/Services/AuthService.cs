using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using XPEHb.Models.Entities;
using XPEHb.Models.Dtos;


namespace XPEHb.Services;
public class AuthService
{
    private readonly MetaContext _db;

    public AuthService(MetaContext db)
    {
        _db = db;
    }

    public async Task<IResult> LoginAsync(string username, string password, HttpContext httpContext)
    {
        // var response = await ExternalApiCheckAsync(username, password);

        // if (!response.IsSuccessStatusCode)
        // {
        //     string errorContent = await response.Content.ReadAsStringAsync();

        //     int statusCode = (int)response.StatusCode;

        //     return Results.Json(
        //         data: new 
        //         { 
        //             error = "ExternalError",
        //             message = "Внешний сервис вернул ошибку.",
        //             externalStatus = statusCode,
        //             externalResponse = errorContent
        //         }
        //     );
        // }

        var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Name == username);

        if (dbUser == null)
        {
            dbUser = new User 
            { 
                Name = username
            };
            _db.Userroles.Add(new Userrole{ User = dbUser, RoleId = 2 });
            _db.Users.Add(dbUser);
            await _db.SaveChangesAsync();
        }

        var userRoles = await _db.Userroles
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

        return Results.Ok(username);
    }

    private async Task<HttpResponseMessage> ExternalApiCheckAsync(string userName, string password)
    {
        using HttpClient client = new HttpClient();

        var user = new 
        {
            userName,
            password
        };

        var response = await client.PostAsJsonAsync(Environment.GetEnvironmentVariable("AUTH_URL"), user);
        return response;
    }
}