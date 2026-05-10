using Microsoft.AspNetCore.Builder;
using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class KeyMetadataEndpoints
{
    public static void MapKeyMetadataEndpoints(this IEndpointRouteBuilder app)
    {
        // GET /keymetadata
        app.MapGet("/keymetadata", async ([AsParameters] KeyMetadataFilterDto filter, DbService db) => {
            IEnumerable<KeyMetadataDto> metadata = await db.GetKeysMetadataAsync(filter);
            return Results.Ok(metadata);
        });

        // POST /keymetadata
        app.MapPost("/keymetadata", async (string name, DbService db) => {
            await db.CreateKeyMetadataAsync(name);
            return Results.Ok();
        });

        // PUT /keymetadata
        app.MapPut("/keymetadata", async (KeyMetadataDto dto, DbService db) => {
            if (dto.Name == null) return Results.BadRequest("Name cannot be null");
            await db.UpdateKeyMetadataAsync(dto.Id, dto.Name);
            return Results.Ok();
        });

        // DELETE /keymetadata (возможно, стоит удалить, так как может нарушить целостность данных)
        app.MapDelete("/keymetadata", async (int id, DbService db) => {
            await db.DeleteKeyMetadataAsync(id);
            return Results.Ok();
        });
    }
}