using XPEHb.Models.Entities;
using XPEHb.Models.Dtos;
using XPEHb.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace XPEHb.Endpoints;

public static class UserAndRoleEndpoints
{
    public static void MapUserAndRoleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("user");

        // GET /user
        group.MapGet("/user", async ([AsParameters] UserFilterDto filter, UserAndRoleService db) => {
            var (items, total) = await db.GetUsersAsync(filter);
            return Results.Ok(new { items, total });
        })
        .RequireAuthorization("RequireAdmin");

        // GET /user/me
        group.MapGet("/user/me", async (ClaimsPrincipal user, UserAndRoleService db) => {
            return Results.Ok(user.Identity?.Name);
        });

        // PATCH /user/{name}
        group.MapPatch("/user/{name}", async (string name, [FromBody] RolePatchDto rolePatchDto, UserAndRoleService db) => {
            await db.ChangeUserRolesAsync(name, rolePatchDto.RoleIds, rolePatchDto.Delete);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");

        // GET /role
        group.MapGet("/role", async ([AsParameters] RoleFilterDto filter, UserAndRoleService db) => {
            var (items, total) = await db.GetRolesAsync(filter);
            return Results.Ok(new { items, total });
        })
        .RequireAuthorization("RequireAdmin");

        // POST /role
        group.MapPost("/role", async ([FromBody] string name, UserAndRoleService db) => {
            if (string.IsNullOrWhiteSpace(name))
                return Results.BadRequest(new { message = "Name is required" });
            await db.CreateRolesAsync(name);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");
    }
}