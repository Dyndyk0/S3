using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using XPEHb.Models.Dtos;
using XPEHb.src.Models.Entities;
namespace XPEHb.Services;
public class DbService
{
    private readonly MyDbContext _db;

    public DbService(MyDbContext db)
    {
        _db = db;
    }

    public async Task<(IEnumerable<Keymetadatum> keys, IEnumerable<Valuemetadatum> values)> GetMetadataAsync()
    {
        var keys = await _db.Keymetadata.ToListAsync();
        var values = await _db.Valuemetadata.ToListAsync();
        return (keys, values);
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
            catch { /* игнорируем некорректный JSON или логируем */ }
        }

        // Применяем фильтр по тегам
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

        var result = await query
            .OrderByDescending(f => f.LastUpdated)
            .Skip(filter.Offset)
            .Take(filter.Limit)
            .ToListAsync();

        return result.Select(f => new FileDto // Используем новое название
        {
            Id = f.Id,
            Name = f.Name,
            Link = f.Link,
            LastUpdated = f.LastUpdated,
            Tags = f.Metadata.Select(m => new TagDto(
                m.Valuemetadata.KeymetadataId, 
                m.Valuemetadata.Keymetadata.Name, 
                m.Valuemetadata.Id, 
                m.Valuemetadata.Name
            )).ToList()
        });
    }

    public async Task<string?> GetLinkByIdAsync(int fileId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
        return file?.Link;
    }

    public async Task<string> InitFileMetadataAsync(string fileName, List<int> valueMetadataIds)
    {
        var file = new src.Models.Entities.File
        {
            Name = fileName,
            Link = "temp_link",
            LastUpdated = DateTime.UtcNow,
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
        return file.Link;
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

    public async Task CreateTypeAsync(string name)
    {
        _db.Keymetadata.Add(new Keymetadatum { Name = name });
        await _db.SaveChangesAsync();
    }

    public async Task CreateCategoryAsync(int KeymetadataId, string name)
    {
        _db.Valuemetadata.Add(new Valuemetadatum { KeymetadataId = KeymetadataId, Name = name });
        await _db.SaveChangesAsync();
    }
}