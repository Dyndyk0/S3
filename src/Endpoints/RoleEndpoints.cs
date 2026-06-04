using XPEHb.Models.Entities;
using XPEHb.Models.Dtos;
using XPEHb.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace XPEHb.Endpoints;

public static class RoleEndpoints
{
    public static void MapRoleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("role");

        // GET /role
        group.MapGet("/role", async ([AsParameters] RoleFilterDto filter, RoleService db) => {
            var (items, total) = await db.GetRolesAsync(filter);
            return Results.Ok(new { items, total });
        })
        .RequireAuthorization("RequireAdmin");

        // POST /role
        group.MapPost("/role", async (RolePostDto dto, RoleService db) => {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return Results.BadRequest(new { message = "Name is required" });
            await db.CreateRolesAsync(dto.Name);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");

        // DELETE /role
        group.MapDelete("/role", async ([FromBody] List<int> ids, RoleService db) => {
            if (ids.Count == 0)
                return Results.BadRequest(new { message = "ids is required" });
            await db.DeleteRolesAsync(ids);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");
    }
}