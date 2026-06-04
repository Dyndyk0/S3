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
   
        string? username = principal.Identity?.Name;
        
        if (string.IsNullOrEmpty(username))
        {
            return principal;
        }

        var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Name == username);
        if (dbUser == null)
        {
            // dbUser = new User 
            // { 
            //     Name = username
            // };
            // _db.Userroles.Add(new Userrole{ User = dbUser, RoleId = 2 });
            // _db.Users.Add(dbUser);
            // await _db.SaveChangesAsync();
            return principal;
        }

        var userRoles = await _db.Userroles
            .Where(ur => ur.UserId == dbUser.Id)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        var localIdentity = new ClaimsIdentity();
        
        localIdentity.AddClaim(new Claim("LocalClaimsLoaded", "true"));

        foreach (var roleName in userRoles)
        {
            localIdentity.AddClaim(new Claim(ClaimTypes.Role, roleName));
        }

        principal.AddIdentity(localIdentity);

        return principal;
    }
}