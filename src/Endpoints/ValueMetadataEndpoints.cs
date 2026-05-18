using Microsoft.AspNetCore.Builder;
using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class ValueMetadataEndpoints
{
    public static void MapValueMetadataEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("valuemetadata");

        // GET /valuemetadata
        group.MapGet("/valuemetadata", async ([AsParameters] ValueMetadataFilterDto filter, DbService db) => {
            IEnumerable<ValueMetadataDto> metadata = await db.GetValueMetadataAsync(filter);
            return Results.Ok(metadata);
        });

        // POST /valuemetadata
        group.MapPost("/valuemetadata", async (int keyMetadataId, string name, DbService db) => {
            await db.CreateValueMetadataAsync(keyMetadataId, name);
            return Results.Ok();
        });

        // PATCH /valuemetadata
        group.MapPatch("/valuemetadata", async (ValueMetadataDto dto, DbService db) => {
            await db.UpdateValueMetadataAsync(dto);
            return Results.Ok();
        });

        // DELETE /valuemetadata (возможно, стоит удалить, так как может нарушить целостность данных)
        group.MapDelete("/valuemetadata", async (int id, DbService db) => {
            await db.DeleteValueMetadataAsync(id);
            return Results.Ok();
        });
    }
}