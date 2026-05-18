using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class TemplateEndpoints
{
    public static void MapTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("templates");

        // GET /templates
        group.MapGet("/templates", async ([AsParameters] TemplateFilterDto filter, DbService db) => {
            var (items, total) = await db.GetTemplatesAsync(filter);
            return Results.Ok(new { items, total });
        });

        // GET /templates/{id}
        group.MapGet("/templates/{id}", async (int id, DbService db) => {
            var template = await db.GetTemplateDetailAsync(id);
            if (template == null)
                return Results.NotFound(new { message = "Template not found" });
            return Results.Ok(template);
        });

        // POST /templates
        group.MapPost("/templates", async (CreateTemplateDto dto, DbService db) => {
            if (string.IsNullOrWhiteSpace(dto.Name) || !dto.KeyIds.Any())
                return Results.BadRequest(new { message = "Name and KeyIds are required" });

            var templateId = await db.CreateTemplateAsync(dto);
            return Results.Created($"/templates/{templateId}", new { id = templateId });
        });

        // PUT /templates/{id}
        group.MapPut("/templates/{id}", async (int id, CreateTemplateDto dto, DbService db) => {
            if (string.IsNullOrWhiteSpace(dto.Name) || !dto.KeyIds.Any())
                return Results.BadRequest(new { message = "Name and KeyIds are required" });
                
            var updated = await db.UpdateTemplateAsync(id, dto);
            if (!updated)
                return Results.NotFound(new { message = "Template not found" });

            return Results.Ok(new { id });
        });

        // DELETE /templates/{id}
        group.MapDelete("/templates/{id}", async (int id, DbService db) => {
            var deleted = await db.DeleteTemplateAsync(id);
            if (!deleted)
                return Results.NotFound(new { message = "Template not found" });

            return Results.Ok(new { message = "Template deleted" });
        });
    }
}
