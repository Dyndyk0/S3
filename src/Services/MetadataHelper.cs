using System.Globalization;
using XPEHb.Models.Entities;

namespace XPEHb.Services;
public static class MetadataHelper
{
    public static string GetDisplayValue(Metadata m, string? dataType)
    {
        if (!Enum.TryParse<MetadataType>(dataType, true, out var type)) 
            return "";

        return type switch
        {
            MetadataType.text => m.ValueString ?? "",
            MetadataType.number => m.ValueNumber?.ToString(CultureInfo.InvariantCulture) ?? "",
            MetadataType.boolean => m.ValueBoolean?.ToString() ?? "",
            MetadataType.date => m.ValueDate?.ToString("yyyy-MM-dd") ?? "",
            MetadataType.select => m.Valuemetadata?.Name ?? "",
            _ => ""
        };
    }

    public static void SetValueFromString(Metadata m, string dataType, string rawValue)
    {
        // Сначала очищаем все поля (полезно при Update, если тип почему-то поменялся)
        m.ValueString = null;
        m.ValueNumber = null;
        m.ValueBoolean = null;
        m.ValueDate = null;
        m.ValuemetadataId = null;

        if (!Enum.TryParse<MetadataType>(dataType, true, out var type)) 
            return;

        switch (type)
        {
            case MetadataType.text:
                m.ValueString = rawValue;
                break;
            case MetadataType.number:
                if (double.TryParse(rawValue.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double n))
                    m.ValueNumber = n;
                break;
            case MetadataType.boolean:
                if (bool.TryParse(rawValue, out bool b))
                    m.ValueBoolean = b;
                break;
            case MetadataType.date:
                if (DateTime.TryParse(rawValue, out DateTime d))
                    m.ValueDate = d;
                break;
            case MetadataType.select:
                if (int.TryParse(rawValue, out int vId))
                    m.ValuemetadataId = vId;
                break;
        }
    }
    public static bool TrySetValueFromString(Metadata m, string dataType, string rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue)) return false;
        if (!Enum.TryParse<MetadataType>(dataType, true, out var type)) return false;
        
        m.ValueString = null;
        m.ValueNumber = null;
        m.ValueBoolean = null;
        m.ValueDate = null;
        m.ValuemetadataId = null;

        switch (type)
        {
            case MetadataType.text:
                m.ValueString = rawValue;
                return true;
                
            case MetadataType.number:
                if (double.TryParse(rawValue.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double n))
                {
                    m.ValueNumber = n;
                    return true;
                }
                return false;
                
            case MetadataType.boolean:
                if (bool.TryParse(rawValue, out bool b))
                {
                    m.ValueBoolean = b;
                    return true;
                }
                return false;
                
            case MetadataType.date:
                if (DateTime.TryParse(rawValue, out DateTime d))
                {
                    m.ValueDate = d;
                    return true;
                }
                return false;
                
            case MetadataType.select:
                if (int.TryParse(rawValue, out int vId))
                {
                    m.ValuemetadataId = vId;
                    return true;
                }
                return false;
                
            default:
                return false;
        }
    }
}