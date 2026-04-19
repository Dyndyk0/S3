using Microsoft.EntityFrameworkCore;
using XPEHb.Models;

namespace XPEHb.Services;

public class DbService
{
    private readonly MyDbContext _db;

    public DbService(MyDbContext db)
    {
        _db = db;
    }

    public async Task<(IEnumerable<TypeMetadata> types, IEnumerable<CategoryMetadata> cats)> GetMetadataAsync()
    {
        var types = await _db.Types.ToListAsync();
        var cats = await _db.Categories.ToListAsync();
        return (types, cats);
    }

    public async Task<IEnumerable<FileViewDto>> GetFilesAsync(FileFilterRequest filter)
    {
        var query = _db.Files
            .Include(f => f.Metadatas)
                .ThenInclude(m => m.Category)
                .ThenInclude(c => c.Type)
            //.Where(f => !f.IsDeleted && f.IsUploaded) // Только загруженные и не удаленные
            .AsQueryable();

        if (filter.DateFrom.HasValue)
            query = query.Where(f => f.LastUpdated >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue)
            query = query.Where(f => f.LastUpdated <= filter.DateTo.Value);

        if (filter.Tags != null && filter.Tags.Any())
        {
            foreach (var tag in filter.Tags)
            {
                query = query.Where(f => f.Metadatas.Any(m => 
                    m.Category.TypeMetadataId == tag.TypeId &&
                    EF.Functions.ILike(m.Category.Name, $"%{tag.Category}%")
                ));
            }
        }

        var result = await query
            .OrderByDescending(f => f.LastUpdated)
            .Skip(filter.Offset)
            .Take(filter.Limit)
            .ToListAsync();

        return result.Select(f => new FileViewDto
        {
            Id = f.Id,
            Name = f.Name,
            Link = f.Link,
            LastUpdated = f.LastUpdated,
            Tags = f.Metadatas.Select(m => new TagDto(
                m.Category.TypeMetadataId, 
                m.Category.Type.Name, 
                m.Category.Id, 
                m.Category.Name
            )).ToList()
        });
    }

    public async Task<string?> GetLinkByIdAsync(int fileId)
    {
        var file = await _db.Files.FirstOrDefaultAsync(f => f.Id == fileId);
        return file?.Link;
    }

    public async Task<string> InitFileMetadataAsync(string fileName, List<int> categoryIds)
    {
        var file = new FileEntity
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

        if (categoryIds != null)
        {
            foreach (var catId in categoryIds)
            {
                _db.Metadatas.Add(new Metadata { FileId = file.Id, CategoryMetadataId = catId });
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
        var file = await _db.Files.Include(f => f.Metadatas).FirstOrDefaultAsync(f => f.Link == link);
        if (file != null)
        {
            _db.Metadatas.RemoveRange(file.Metadatas);
            _db.Files.Remove(file);
            await _db.SaveChangesAsync();
        }
    }

    public async Task CreateTypeAsync(string name)
    {
        _db.Types.Add(new TypeMetadata { Name = name });
        await _db.SaveChangesAsync();
    }

    public async Task CreateCategoryAsync(int typeId, string name)
    {
        _db.Categories.Add(new CategoryMetadata { TypeMetadataId = typeId, Name = name });
        await _db.SaveChangesAsync();
    }
}