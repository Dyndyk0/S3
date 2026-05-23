using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;
namespace XPEHb.Services;
public class KeyMetadataService
{
    private readonly MetaContext _db;

    public KeyMetadataService(MetaContext db)
    {
        _db = db;
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

        if (!string.IsNullOrWhiteSpace(filter.DataType?.ToString()))
        {
            string pattern = $"%{filter.DataType}%";
            query = query.Where(k => k.DataType != null && EF.Functions.Like(k.DataType, pattern));
        }

        var keys = await query
            .OrderBy(k => k.Id)
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 100)
            .Select(k => new KeyMetadataDto(
                k.Id,
                k.Name,
                k.DataType
            ))
            .ToListAsync();

        return keys;
    }
    
    public async Task CreateKeyMetadataAsync(string name, MetadataType dataType)
    {
        _db.Keymetadata.Add(new Keymetadatum { Name = name, DataType = dataType.ToString() });
        await _db.SaveChangesAsync();
    }
    
    public async Task UpdateKeyMetadataAsync(int id, string name)
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
}