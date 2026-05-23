using CommunityToolkit.HighPerformance.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using System.Text.Json;
using System.Globalization;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;
using XPEHb.Extensions;

namespace XPEHb.Services;
public class FileService
{
    private readonly MetaContext _db;

    public FileService(MetaContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<FileDto>> GetFilesAsync(FileFilterDto filter)
    {
        // 1. Изменили Includes. Теперь Keymetadata привязана напрямую к Metadata
        var query = _db.Files
            .Include(f => f.Metadata).ThenInclude(m => m.Keymetadata)
            .Include(f => f.Metadata).ThenInclude(m => m.Valuemetadata)
            //.Where(f => !f.IsDeleted && f.IsUploaded)
            .AsQueryable();

        if (filter.DateUploadFrom.HasValue)
            query = query.Where(f => f.DateUpload >= filter.DateUploadFrom.Value);
        if (filter.DateUploadTo.HasValue)
            query = query.Where(f => f.DateUpload <= filter.DateUploadTo.Value);
        if (filter.LastUpdatedFrom.HasValue)
            query = query.Where(f => f.LastUpdated >= filter.LastUpdatedFrom.Value);
        if (filter.LastUpdatedTo.HasValue)
            query = query.Where(f => f.LastUpdated <= filter.LastUpdatedTo.Value);
        if (!string.IsNullOrWhiteSpace(filter.FileName))
            query = query.Where(f => EF.Functions.ILike(f.Name, $"%{filter.FileName}%"));
        if (!string.IsNullOrWhiteSpace(filter.FileExtension))
            query = query.Where(f => EF.Functions.ILike(f.FileExtension, $"%{filter.FileExtension}%"));

        var tags = ParseTagsFromJson(filter.TagsJson);
        if (tags != null && tags.Any())
        {
            var tagIds = tags.Select(t => t.KeyId).Distinct().ToList();
            var keyTypes = await _db.Keymetadata
                .Where(k => tagIds.Contains(k.Id))
                .ToDictionaryAsync(k => k.Id, k => k.DataType);

            // Вся магия фильтрации теперь спрятана в одной строке!
            query = query.ApplyMetadataFilters(tags, keyTypes);
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
            "dateupload" => filter.SortDescending ? query.OrderByDescending(f => f.DateUpload) : query.OrderBy(f => f.DateUpload),
            "lastupdated" => filter.SortDescending ? query.OrderByDescending(f => f.LastUpdated) : query.OrderBy(f => f.LastUpdated),
            "name" => filter.SortDescending ? query.OrderByDescending(f => f.Name) : query.OrderBy(f => f.Name),
            _ => query.OrderByDescending(f => f.LastUpdated)
        };

        var result = await query
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 100)
            .ToListAsync();

        // 4. НОВАЯ ЛОГИКА МАППИНГА DTO
        var dtos = result.Select(f => new FileDto
        {
            Id = f.Id,
            Name = f.Name,
            FileExtension = f.FileExtension,
            Link = f.Link,
            DateUpload = f.DateUpload,
            LastUpdated = f.LastUpdated,
            Tags = f.Metadata.Select(m => new TagDto(
                m.KeymetadataId, 
                m.Keymetadata?.Name, 
                m.ValuemetadataId, 
                MetadataHelper.GetDisplayValue(m, m.Keymetadata?.DataType) // Используем Helper
            )).ToList()
        }).ToList();

        return dtos;
    }

    private List<TagFilterDto>? ParseTagsFromJson(string? tagsJson)
    {
        if (string.IsNullOrWhiteSpace(tagsJson))
            return null;

        try
        {
            List<TagFilterDto>? tags = null;
            if (!string.IsNullOrWhiteSpace(tagsJson))
            {
                try { tags = JsonSerializer.Deserialize<List<TagFilterDto>>(tagsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }); }
                catch (Exception ex) { Console.WriteLine($"JSON TagFilterDto Error: {ex.Message}"); }
            }
            return tags;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"JSON TagFilterDto Error: {ex.Message}");
            return null;
        }
    }

    public async Task<string?> GetLinkByIdAsync(int fileId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
        return file?.Link;
    }

    public async Task<(int id, string link)> InitFileMetadataAsync(string fileName, string fileExtension, List<FileTagInitDto> Tags)
    {
        var file = new Models.Entities.File
        {
            Name = fileName,
            FileExtension = fileExtension,
            Link = "temp_link",
            DateUpload = DateTime.Now,
            LastUpdated = DateTime.Now,
            IsUploaded = false,
            IsDeleted = false
        };

        _db.Files.Add(file);
        await _db.SaveChangesAsync();

        file.Link = $"{file.Id}_{fileName}";

        if (Tags != null)
        {
            var keyIds = Tags.Select(t => t.KeyId).ToList();

            var keyTypes = await _db.Keymetadata
                .Where(k => keyIds.Contains(k.Id))
                .ToDictionaryAsync(k => k.Id, k => k.DataType);

            _db.Metadata.RemoveRange(file.Metadata);
            
            foreach (var tag in Tags)
            {
                if (tag.Value == null) continue;

                var type = keyTypes[tag.KeyId];
        
                var metadata = new Metadata 
                { 
                    FileId = file.Id, 
                    KeymetadataId = tag.KeyId 
                };

                // Helper сам разберется, в какую колонку записать значение
                MetadataHelper.SetValueFromString(metadata, type, tag.Value);

                _db.Metadata.Add(metadata);
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

    public async Task<(int id, string newLink)> UpdateFileAsync(int fileId, List<FileTagInitDto>? Tags, string? fileName, string? fileExtension)
    {

        var file = await _db.Files.Include(f => f.Metadata).FirstOrDefaultAsync(f => f.Id == fileId);
        if (file == null) return (0, "");

        if (Tags != null)
        {
            var keyIds = Tags.Select(t => t.KeyId).ToList();

            var keyTypes = await _db.Keymetadata
                .Where(k => keyIds.Contains(k.Id))
                .ToDictionaryAsync(k => k.Id, k => k.DataType);

            _db.Metadata.RemoveRange(file.Metadata);
            
            foreach (var tag in Tags)
            {
                if (tag.Value == null) continue;

                var type = keyTypes[tag.KeyId];
        
                var metadata = new Metadata 
                { 
                    FileId = fileId, 
                    KeymetadataId = tag.KeyId 
                };

                // Helper сам разберется, в какую колонку записать значение
                MetadataHelper.SetValueFromString(metadata, type, tag.Value);

                _db.Metadata.Add(metadata);
            }
        }

        if (!string.IsNullOrWhiteSpace(fileName))
        {
            file.Name = fileName;
        }

        if (!string.IsNullOrWhiteSpace(fileExtension))
        {
            file.FileExtension = fileExtension;
        }

        file.LastUpdated = DateTime.Now;
        await _db.SaveChangesAsync();
        return (file.Id, file.Link);
    }

    public async Task<string?> GetFileNameWithFileExtensionByIdAsync(int fileId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
        return file != null ? $"{file.Name}.{file.FileExtension}" : null;
    }
}