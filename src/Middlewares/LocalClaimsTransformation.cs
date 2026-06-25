using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using XPEHb.Models.Entities; // Ваш DbContext

namespace XPEHb.Middlewares;

public class LocalClaimsTransformation : IClaimsTransformation
{
    private readonly MetaContext _db;

    public LocalClaimsTransformation(MetaContext db)
    {
        _db = db;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.HasClaim(c => c.Type == "LocalClaimsLoaded"))
        {
            return principal;
        }
   
        string? username = principal.FindFirst("login")?.Value;
        
        if (string.IsNullOrEmpty(username))
        {
            return principal;
        }

        var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Name.ToLower() == username.ToLower());
        if (dbUser == null)
        {
            return principal;
        }

        var userRoles = await _db.Userroles
            .Where(ur => ur.UserId == dbUser.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        var localIdentity = new ClaimsIdentity();
        
        localIdentity.AddClaim(new Claim("LocalClaimsLoaded", "true"));
        
        localIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, dbUser.Id.ToString()));

        foreach (var roleName in userRoles)
        {
            localIdentity.AddClaim(new Claim(ClaimTypes.Role, roleName));
        }

        principal.AddIdentity(localIdentity);

        return principal;
    }
}