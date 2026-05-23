using System.Globalization;
using Microsoft.EntityFrameworkCore;
using XPEHb.Models.Entities;
using XPEHb.Models.Dtos;

namespace XPEHb.Extensions;

public static class QueryExtensions
{
    public static IQueryable<XPEHb.Models.Entities.File> ApplyMetadataFilters(
        this IQueryable<XPEHb.Models.Entities.File> query, 
        List<TagFilterDto> tags, 
        Dictionary<int, string> keyTypes)
    {
        foreach (var tag in tags)
        {
            if (!keyTypes.TryGetValue(tag.KeyId, out string? dataTypeString)) continue;
            if (!Enum.TryParse<MetadataType>(dataTypeString, true, out var type)) continue;

            int keyId = tag.KeyId;
            string valStr = tag.Value;

            query = type switch
            {
                MetadataType.text => query.Where(f => f.Metadata.Any(m => 
                    m.KeymetadataId == keyId && EF.Functions.ILike(m.ValueString, $"%{valStr}%"))),

                MetadataType.number => double.TryParse(valStr.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double valNum)
                    ? query.Where(f => f.Metadata.Any(m => m.KeymetadataId == keyId && m.ValueNumber == valNum))
                    : query,

                MetadataType.boolean => bool.TryParse(valStr, out bool valBool)
                    ? query.Where(f => f.Metadata.Any(m => m.KeymetadataId == keyId && m.ValueBoolean == valBool))
                    : query,

                MetadataType.date => DateTime.TryParse(valStr, out DateTime valDate)
                    ? query.Where(f => f.Metadata.Any(m => m.KeymetadataId == keyId && m.ValueDate >= valDate && m.ValueDate < valDate.AddDays(1)))
                    : query,

                MetadataType.select => query.Where(f => f.Metadata.Any(m => 
                    m.KeymetadataId == keyId && m.Valuemetadata != null && EF.Functions.ILike(m.Valuemetadata.Name, $"%{valStr}%"))),

                _ => query
            };
        }
        return query;
    }
}