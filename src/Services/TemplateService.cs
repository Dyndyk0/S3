using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;
namespace XPEHb.Services;
public class TemplateService
{
    private readonly MetaContext _db;

    public TemplateService(MetaContext db)
    {
        _db = db;
    }
    
    // Template
    public async Task<(IEnumerable<TemplateDto> Items, int Total)> GetTemplatesAsync(TemplateFilterDto filter)
    {
        var query = _db.Templates.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter?.Name))
        {
            var pattern = $"%{filter.Name}%";
            query = query.Where(t => t.Name != null && EF.Functions.ILike(t.Name, pattern));
        }

        var total = await query.CountAsync();

        query = query.OrderBy(t => t.Id);

        var items = await query
            .Skip(filter?.Offset ?? 0)
            .Take(filter?.Limit ?? 100)
            .Select(t => new TemplateDto(t.Id, t.Name))
            .ToListAsync();

        return (items, total);
    }

    public async Task<IEnumerable<TemplateDto>> GetAllTemplatesAsync()
    {
        var (items, _) = await GetTemplatesAsync(new TemplateFilterDto { Offset = 0, Limit = 100 });
        return items;
    }

    public async Task<TemplateDetailDto?> GetTemplateDetailAsync(int templateId)
    {
        var template = await _db.Templates
            .Include(t => t.Metadatatemplates)
                .ThenInclude(mt => mt.Keymetadata)
                    .ThenInclude(k => k.Valuemetadata)
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null)
            return null;

        var fields = template.Metadatatemplates
            .Select(mt => new TemplateFieldDto(
                mt.KeymetadataId,
                mt.Keymetadata.Name ?? "",
                mt.IsRequired,
                mt.IsMultiple,
                mt.Keymetadata.Valuemetadata
                    .Select(v => new ValueMetadataDto(v.Id, v.Name, v.KeymetadataId))
                    .ToList()
            ))
            .ToList();

        return new TemplateDetailDto(template.Id, template.Name, fields);
    }

    public async Task<int> CreateTemplateAsync(CreateTemplateDto dto)
    {
        var template = new Template { Name = dto.Name };
        _db.Templates.Add(template);
        await _db.SaveChangesAsync();

        if (dto.Keys?.Count == 0 || dto.Keys == null)
        {
            await _db.SaveChangesAsync();
            return template.Id;
        }

        foreach (var key in dto.Keys)
        {
            _db.Metadatatemplates.Add(new Metadatatemplate 
            { 
                TemplateId = template.Id, 
                KeymetadataId = key.KeyId,
                IsRequired = key.IsRequired,
                IsMultiple = key.IsMultiple
            });
        }

        await _db.SaveChangesAsync();
        return template.Id;
    }

    public async Task<bool> UpdateTemplateAsync(int templateId, CreateTemplateDto dto)
    {
        var template = await _db.Templates
            .Include(t => t.Metadatatemplates)
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null) return false;
        
        if (!string.IsNullOrWhiteSpace(dto.Name))
            template.Name = dto.Name;
        _db.Metadatatemplates.RemoveRange(template.Metadatatemplates);
        
        if (dto.Keys?.Count == 0 || dto.Keys == null)
        {
            await _db.SaveChangesAsync();
            return true;
        }
        foreach (var key in dto.Keys)
        {
            _db.Metadatatemplates.Add(new Metadatatemplate
            {
                TemplateId = template.Id,
                KeymetadataId = key.KeyId,
                IsRequired = key.IsRequired,
                IsMultiple = key.IsMultiple
            });
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteTemplateAsync(int templateId)
    {
        var template = await _db.Templates
            .Include(t => t.Metadatatemplates)
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null)
            return false;

        _db.Metadatatemplates.RemoveRange(template.Metadatatemplates);
        _db.Templates.Remove(template);
        await _db.SaveChangesAsync();

        return true;
    }
}