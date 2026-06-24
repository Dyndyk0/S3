using XPEHb.Models.Entities;
using XPEHb.Models.Dtos;
using XPEHb.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace XPEHb.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("user");

        // GET /user
        group.MapGet("/user", async ([AsParameters] UserFilterDto filter, UserService db) => {
            var (items, total) = await db.GetUsersAsync(filter);
            return Results.Ok(new { items, total });
        })
        .RequireAuthorization("RequireAdmin");

        // GET /user/me
        group.MapGet("/user/me", async (ClaimsPrincipal user, UserService db) => {
            var me = await db.GetMeAsync(user.FindFirst("login")?.Value);
            return Results.Ok(me);
        });

        // PATCH /user/{name}
        group.MapPatch("/user/{name}", async (string name, [FromBody] RolePatchDto rolePatchDto, UserService db) => {
            await db.ChangeUserRolesAsync(name, rolePatchDto.RoleIds, rolePatchDto.Delete);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");
    }
}