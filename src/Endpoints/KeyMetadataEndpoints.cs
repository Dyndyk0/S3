using Microsoft.AspNetCore.Builder;
using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class KeyMetadataEndpoints
{
    public static void MapKeyMetadataEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("keymetadata");

        // GET /keymetadata
        group.MapGet("/keymetadata", async ([AsParameters] KeyMetadataFilterDto filter, DbService db) => {
            IEnumerable<KeyMetadataDto> metadata = await db.GetKeysMetadataAsync(filter);
            return Results.Ok(metadata);
        });

        // POST /keymetadata
        group.MapPost("/keymetadata", async (string name, DbService db) => {
            await db.CreateKeyMetadataAsync(name);
            return Results.Ok();
        });

        // PUT /keymetadata
        group.MapPut("/keymetadata", async (KeyMetadataDto dto, DbService db) => {
            await db.UpdateKeyMetadataAsync(dto.Id, dto.Name);
            return Results.Ok();
        });

        // DELETE /keymetadata (возможно, стоит удалить, так как может нарушить целостность данных)
        group.MapDelete("/keymetadata", async (int id, DbService db) => {
            await db.DeleteKeyMetadataAsync(id);
            return Results.Ok();
        });
    }
}