using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;
namespace XPEHb.Services;
public class DbService
{
    private readonly MetaContext _db;

    public DbService(MetaContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<FileDto>> GetFilesAsync(FileFilterDto filter)
    {
        var query = _db.Files
            .Include(f => f.Metadata)
                .ThenInclude(m => m.Valuemetadata)
                .ThenInclude(c => c.Keymetadata)
            //.Where(f => !f.IsDeleted && f.IsUploaded) // Только загруженные и не удаленные
            .AsQueryable();

        if (filter.DateFrom.HasValue)
            query = query.Where(f => f.LastUpdated >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue)
            query = query.Where(f => f.LastUpdated <= filter.DateTo.Value);

        // Парсим теги из JSON-строки (если она была передана)
        List<TagFilterDto>? tags = null;
        if (!string.IsNullOrWhiteSpace(filter.TagsJson))
        {
            try { tags = JsonSerializer.Deserialize<List<TagFilterDto>>(filter.TagsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }); }
            catch (Exception ex) { Console.WriteLine($"JSON TagFilterDto Error: {ex.Message}"); }
        }

        if (tags != null && tags.Any())
        {
            foreach (var tag in tags)
            {
                query = query.Where(f => f.Metadata.Any(m => 
                    m.Valuemetadata.KeymetadataId == tag.KeyId &&
                    EF.Functions.ILike(m.Valuemetadata.Name, $"%{tag.Value}%")
                ));
            }
        }

        if (filter.TagIds != null && filter.TagIds.Any())
        {
            foreach (var tagId in filter.TagIds)
            {
                query = query.Where(f => f.Metadata.Any(m => m.ValuemetadataId == tagId));
            }
        }

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "dateupload" => filter.SortDescending
                ? query.OrderByDescending(f => f.DateUpload)
                : query.OrderBy(f => f.DateUpload),
            "lastupdated" => filter.SortDescending
                ? query.OrderByDescending(f => f.LastUpdated)
                : query.OrderBy(f => f.LastUpdated),
            "name" => filter.SortDescending
                ? query.OrderByDescending(f => f.Name)
                : query.OrderBy(f => f.Name),
            _ => query.OrderByDescending(f => f.LastUpdated)
        };

        var result = await query
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 100)
            .ToListAsync();

        var dtos = result.Select(f => new FileDto
        {
            Id = f.Id,
            Name = f.Name,
            Link = f.Link,
            LastUpdated = f.LastUpdated,
            Tags = f.Metadata.Select(m => new TagDto(
                m.Valuemetadata.KeymetadataId, 
                m.Valuemetadata.Keymetadata?.Name, 
                m.Valuemetadata.Id, 
                m.Valuemetadata.Name
            )).ToList()
        });
        return dtos;
    }

    public async Task<string?> GetLinkByIdAsync(int fileId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
        return file?.Link;
    }

    public async Task<(int id, string link)> InitFileMetadataAsync(string fileName, List<int> valueMetadataIds)
    {
        var file = new Models.Entities.File
        {
            Name = fileName,
            Link = "temp_link",
            DateUpload = DateTime.Now,
            LastUpdated = DateTime.Now,
            IsUploaded = false,
            IsDeleted = false
        };

        _db.Files.Add(file);
        await _db.SaveChangesAsync();

        file.Link = $"{file.Id}_{fileName}";

        if (valueMetadataIds != null)
        {
            foreach (var valueId in valueMetadataIds)
            {
                _db.Metadata.Add(new Metadata { FileId = file.Id, ValuemetadataId = valueId });
            }
        }

        await _db.SaveChangesAsync();
        return (file.Id, file.Link);
    }

    public async Task ConfirmUploadByLinkAsync(string link)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Link == link);
        if (file != null)
        {
            file.IsUploaded = true;
            file.LastUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task DeleteFileAsync(string link)
    {
        var file = await _db.Files.Include(f => f.Metadata).FirstOrDefaultAsync(f => f.Link == link);
        if (file != null)
        {
            _db.Metadata.RemoveRange(file.Metadata);
            _db.Files.Remove(file);
            await _db.SaveChangesAsync();
        }
    }


    // KeyMetadata
    public async Task<IEnumerable<KeyMetadataDto>> GetKeysMetadataAsync(KeyMetadataFilterDto filter)
    {
        var query = _db.Keymetadata.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            string pattern = $"%{filter.Name}%";
            query = query.Where(k => k.Name != null && EF.Functions.Like(k.Name, pattern));
        }

        var keys = await query
            .OrderBy(k => k.Id)
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 100)
            .Select(k => new KeyMetadataDto(
                k.Id,
                k.Name
            ))
            .ToListAsync();

        return keys;
    }
    
    public async Task CreateKeyMetadataAsync(string name)
    {
        _db.Keymetadata.Add(new Keymetadatum { Name = name });
        await _db.SaveChangesAsync();
    }
    
    public async Task UpdateKeyMetadataAsync(int id, string? name)
    {
        var key = await _db.Keymetadata.FindAsync(id);
        if (key != null)
        {
            key.Name = name;
            await _db.SaveChangesAsync();
        }
    }
    
    public async Task DeleteKeyMetadataAsync(int id)
    {
        var key = await _db.Keymetadata.Include(k => k.Valuemetadata).FirstOrDefaultAsync(k => k.Id == id);
        if (key != null)
        {
            _db.Valuemetadata.RemoveRange(key.Valuemetadata);
            _db.Keymetadata.Remove(key);
            await _db.SaveChangesAsync();
        }
    }


    // ValueMetadata
    public async Task<IEnumerable<ValueMetadataDto>> GetValueMetadataAsync(ValueMetadataFilterDto filter)
    {
        var query = _db.Valuemetadata.AsQueryable();

        if (filter.KeyId.HasValue)
            query = query.Where(v => v.KeymetadataId == filter.KeyId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            string pattern = $"%{filter.Name}%";
            query = query.Where(v => v.Name != null && EF.Functions.Like(v.Name, pattern));
        }

        var values = await query
            .OrderBy(v => v.Id)
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 100)
            .Select(v => new ValueMetadataDto(
                v.Id,
                v.Name,
                v.KeymetadataId
            ))
            .ToListAsync();

        return values;
    }

    public async Task CreateValueMetadataAsync(int keyMetadataId, string name)
    {
        _db.Valuemetadata.Add(new Valuemetadatum { KeymetadataId = keyMetadataId, Name = name });
        await _db.SaveChangesAsync();
    }

    public async Task UpdateValueMetadataAsync(ValueMetadataDto dto)
    {
        var value = await _db.Valuemetadata.FindAsync(dto.Id);
        if (value != null)
        {
            value.Name = dto.Name;
            await _db.SaveChangesAsync();
        }
    }

    public async Task DeleteValueMetadataAsync(int id)
    {
        var value = await _db.Valuemetadata.FindAsync(id);
        if (value != null)
        {
            _db.Valuemetadata.Remove(value);
            await _db.SaveChangesAsync();
        }
    }
    
    // Template
    public async Task<IEnumerable<TemplateDto>> GetAllTemplatesAsync()
    {
        var templates = await _db.Templates
            .Select(t => new TemplateDto(t.Id, t.Name))
            .ToListAsync();
        return templates;
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

        foreach (var keyId in dto.KeyIds)
        {
            _db.Metadatatemplates.Add(new Metadatatemplate 
            { 
                TemplateId = template.Id, 
                KeymetadataId = keyId 
            });
        }

        await _db.SaveChangesAsync();
        return template.Id;
    }
}