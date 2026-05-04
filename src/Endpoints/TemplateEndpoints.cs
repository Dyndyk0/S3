using XPEHb.Services;
using XPEHb.Models.Dtos;

public static class TemplateEndpoints
{
    public static void MapTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        // GET /templates - получить все шаблоны
        app.MapGet("/templates", async (DbService db) => {
            var templates = await db.GetAllTemplatesAsync();
            return Results.Ok(templates);
        });

        // GET /templates/{id} - получить детали шаблона с полями
        app.MapGet("/templates/{id}", async (int id, DbService db) => {
            var template = await db.GetTemplateDetailAsync(id);
            if (template == null)
                return Results.NotFound(new { message = "Template not found" });
            return Results.Ok(template);
        });

        // POST /templates - создать новый шаблон
        app.MapPost("/templates", async (CreateTemplateDto dto, DbService db) => {
            if (string.IsNullOrWhiteSpace(dto.Name) || !dto.KeyIds.Any())
                return Results.BadRequest(new { message = "Name and KeyIds are required" });

            var templateId = await db.CreateTemplateAsync(dto);
            return Results.Created($"/templates/{templateId}", new { id = templateId });
        });
    }
}
