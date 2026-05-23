using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;
namespace XPEHb.Services;
public class ValueMetadataService
{
    private readonly MetaContext _db;

    public ValueMetadataService(MetaContext db)
    {
        _db = db;
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
        var key = await _db.Keymetadata.FindAsync(keyMetadataId);
        if (key?.DataType == MetadataType.select.ToString())
            _db.Valuemetadata.Add(new Valuemetadatum { KeymetadataId = keyMetadataId, Name = name });
        await _db.SaveChangesAsync();
    }

    public async Task UpdateValueMetadataAsync(int id, string name)
    {
        var value = await _db.Valuemetadata.FindAsync(id);
        if (value != null)
        {
            value.Name = name;
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
}