using Microsoft.AspNetCore.Builder;
using XPEHb.Services;
using XPEHb.Models.Dtos;

namespace XPEHb.Endpoints;

public static class ValueMetadataEndpoints
{
    public static void MapValueMetadataEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("valuemetadata");

        // GET /valuemetadata
        group.MapGet("/valuemetadata", async ([AsParameters] ValueMetadataFilterDto filter, ValueMetadataService db) => {
            var (items, total) = await db.GetValueMetadataAsync(filter);
            return Results.Ok(new { items, total });
        });

        // POST /valuemetadata
        group.MapPost("/valuemetadata", async (int keyMetadataId, string name, ValueMetadataService db) => {
            await db.CreateValueMetadataAsync(keyMetadataId, name);
            return Results.Ok();
        }).RequireAuthorization("RequireAdmin");

        // PATCH /valuemetadata
        group.MapPatch("/valuemetadata", async (UpdateValueMetadataDto dto, ValueMetadataService db) => {
            await db.UpdateValueMetadataAsync(dto.Id, dto.Name);
            return Results.Ok();
        }).RequireAuthorization("RequireAdmin");

        // DELETE /valuemetadata (возможно, стоит удалить, так как может нарушить целостность данных)
        group.MapDelete("/valuemetadata", async (int id, ValueMetadataService db) => {
            await db.DeleteValueMetadataAsync(id);
            return Results.Ok();
        }).RequireAuthorization("RequireAdmin");
    }
}