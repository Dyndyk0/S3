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

    public async Task<(IEnumerable<FileDto> Files, int Total)> GetFilesAsync(FileFilterDto filter)
    {
        var query = _db.Files
            .Include(f => f.Metadata).ThenInclude(m => m.Keymetadata)
            .Include(f => f.Metadata).ThenInclude(m => m.Valuemetadata)
            .Include(f => f.Creator)
            .Include(f => f.LastEditor)
            .Include(f => f.Template)
            .Where(f => f.IsDeleted == filter.VisibleDeleted)
            //.Where(f => f.IsUploaded)
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
        if (filter.TemplateId.HasValue)
            query = query.Where(f => f.TemplateId == filter.TemplateId.Value);

        var tags = ParseTagsFromJson(filter.TagsJson);
        if (tags != null && tags.Any())
        {
            var tagIds = tags.Select(t => t.KeyId).Distinct().ToList();
            var keyTypes = await _db.Keymetadata
                .Where(k => tagIds.Contains(k.Id))
                .ToDictionaryAsync(k => k.Id, k => k.DataType);

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
            "fileextension" => filter.SortDescending ? query.OrderByDescending(f => f.FileExtension) : query.OrderBy(f => f.FileExtension),
            _ => query.OrderByDescending(f => f.LastUpdated)
        };

        var total = await query.CountAsync();

        var result = await query
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 100)
            .ToListAsync();

        var dtos = result.Select(f => new FileDto
        {
            Id = f.Id,
            TemplateId = f.TemplateId,
            TemplateName = f.Template?.Name,
            Creator = f.Creator.Name,
            Name = f.Name,
            FileExtension = f.FileExtension,
            Link = f.Link,
            DateUpload = f.DateUpload,
            Tags = f.Metadata.Select(m => new TagDto(
                m.KeymetadataId, 
                m.Keymetadata?.Name, 
                m.ValuemetadataId, 
                MetadataHelper.GetDisplayValue(m, m.Keymetadata?.DataType) // Используем Helper
            )).ToList()
        }).ToList();

        return (dtos, total);
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

    public async Task<(int id, string link)> InitFileMetadataAsync(int? templateId, int userId, string fileName, string fileExtension, List<FileTagInitDto>? tags)
    {
        var rulesDict = await ValidateAndGetTemplateRulesAsync(templateId, tags);
        
        var file = new Models.Entities.File
        {
            TemplateId = templateId,
            Name = fileName,
            CreatorId = userId,
            LastEditorId = userId,
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

        BuildAndAttachMetadata(file.Id, tags, rulesDict);

        await _db.SaveChangesAsync();
        return (file.Id, file.Link);
    }

    public async Task ConfirmUploadByLinkAsync(string link)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Link == link);
        if (file != null)
        {
            file.IsUploaded = true;
            file.LastUpdated = DateTime.Now;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<string?> MarkForDeletionAsync(int fileId, bool isDeleted = true)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
        if (file == null) return null;

        file.IsDeleted = isDeleted;
        file.LastUpdated = DateTime.Now;
        await _db.SaveChangesAsync();
        return file.Link;
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

    public async Task<(int id, string newLink)> UpdateFileAsync(int fileId, int userId, int? templateId, List<FileTagInitDto>? tags, string? fileName, string? fileExtension)
    {
        var file = await _db.Files
            .Include(f => f.Metadata)
            .Where(f => !f.IsDeleted)
            .FirstOrDefaultAsync(f => f.Id == fileId);

        if (file == null) return (0, "");

        if (!string.IsNullOrWhiteSpace(fileName)) file.Name = fileName;
        if (!string.IsNullOrWhiteSpace(fileExtension)) file.FileExtension = fileExtension;
        file.TemplateId = templateId;
        file.LastUpdated = DateTime.Now;
        file.LastEditorId = userId; 

        if (tags != null)
        {
            var rulesDict = await ValidateAndGetTemplateRulesAsync(templateId, tags);

            _db.Metadata.RemoveRange(file.Metadata);

            BuildAndAttachMetadata(file.Id, tags, rulesDict);
        }

        await _db.SaveChangesAsync();
        return (file.Id, file.Link);
    }

    public async Task<string?> GetFileNameWithFileExtensionByIdAsync(int fileId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
        return file != null ? $"{file.Name}.{file.FileExtension}" : null;
    }

    private async Task<Dictionary<int, Metadatatemplate>> ValidateAndGetTemplateRulesAsync(int? templateId, List<FileTagInitDto>? tags)
    {
        var templateRules = await _db.Metadatatemplates
            .Include(mt => mt.Keymetadata)
            .Where(mt => mt.TemplateId == templateId)
            .ToListAsync();

        if (!templateRules.Any())
            throw new ValidationException($"Шаблон с ID {templateId} не найден или не содержит тегов.");

        var rulesDict = templateRules.ToDictionary(r => r.KeymetadataId, r => r);

        // Собираем валидные теги (отбрасываем пустые)
        var validTags = tags?.Where(t => !string.IsNullOrWhiteSpace(t.Value)).ToList() ?? new List<FileTagInitDto>();

        var invalidKeys = validTags.Select(t => t.KeyId).Except(rulesDict.Keys).ToList();
        if (invalidKeys.Any()) 
            throw new ValidationException($"Ключи [{string.Join(", ", invalidKeys)}] не принадлежат шаблону.");

        var groupedTags = validTags.GroupBy(t => t.KeyId);
        foreach (var group in groupedTags)
        {
            var rule = rulesDict[group.Key];
            if (!rule.IsMultiple && group.Count() > 1) 
                throw new ValidationException($"Тег '{rule.Keymetadata.Name}' не поддерживает множественные значения.");
        }

        var incomingKeyIds = validTags.Select(t => t.KeyId).ToHashSet();
        var missingRequired = templateRules
            .Where(r => r.IsRequired && !incomingKeyIds.Contains(r.KeymetadataId))
            .Select(r => r.Keymetadata.Name)
            .ToList();

        if (missingRequired.Any()) 
            throw new ValidationException($"Обязательные теги не заполнены: {string.Join(", ", missingRequired)}");

        return rulesDict;
    }

    private void BuildAndAttachMetadata(int fileId, List<FileTagInitDto>? tags, Dictionary<int, Metadatatemplate> rulesDict)
    {
        if (tags == null) return;

        foreach (var tag in tags)
        {
            if (string.IsNullOrWhiteSpace(tag.Value)) continue;

            var rule = rulesDict[tag.KeyId];
            var metadata = new Metadata
            {
                FileId = fileId,
                KeymetadataId = tag.KeyId
            };

            bool isParsed = MetadataHelper.TrySetValueFromString(metadata, rule.Keymetadata.DataType, tag.Value);
            
            if (!isParsed) 
                throw new ValidationException($"Значение '{tag.Value}' не подходит для тега '{rule.Keymetadata.Name}' (ожидается тип {rule.Keymetadata.DataType}).");

            _db.Metadata.Add(metadata);
        }
    }
}