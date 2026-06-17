using Microsoft.AspNetCore.Builder;
using XPEHb.Services;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;

namespace XPEHb.Endpoints;

public static class KeyMetadataEndpoints
{
    public static void MapKeyMetadataEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("keymetadata");

        // GET /keymetadata/types
        group.MapGet("/keymetadata/types", async (KeyMetadataService db) => {
            return Results.Ok(Enum.GetValues<MetadataType>().Select(t => t.ToString()));
        });

        // GET /keymetadata
        group.MapGet("/keymetadata", async ([AsParameters] KeyMetadataFilterDto filter, KeyMetadataService db) => {
            var (items, total) = await db.GetKeysMetadataAsync(filter);
            return Results.Ok(new { items, total });
        });

        // POST /keymetadata
        group.MapPost("/keymetadata", async (string name, MetadataType dataType, KeyMetadataService db) => {
            await db.CreateKeyMetadataAsync(name, dataType);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");

        // PUT /keymetadata
        group.MapPut("/keymetadata", async (PutKeyMetadataDto dto, KeyMetadataService db) => {
            await db.UpdateKeyMetadataAsync(dto.Id, dto.Name);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");

        // DELETE /keymetadata (возможно, стоит удалить, так как может нарушить целостность данных)
        group.MapDelete("/keymetadata", async (int id, KeyMetadataService db) => {
            await db.DeleteKeyMetadataAsync(id);
            return Results.Ok();
        })
        .RequireAuthorization("RequireAdmin");
    }
}