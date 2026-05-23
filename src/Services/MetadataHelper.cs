using System.Globalization;
using XPEHb.Models.Entities;

namespace XPEHb.Services;
public static class MetadataHelper
{
    // 1. Метод для красивого вывода значения (используется в Get)
    public static string GetDisplayValue(Metadata m, string? dataType)
    {
        if (!Enum.TryParse<MetadataType>(dataType, true, out var type)) 
            return "";

        return type switch
        {
            MetadataType.text => m.ValueString ?? "",
            MetadataType.number => m.ValueNumber?.ToString(CultureInfo.InvariantCulture) ?? "",
            MetadataType.boolean => m.ValueBoolean.HasValue ? (m.ValueBoolean.Value ? "Да" : "Нет") : "",
            MetadataType.date => m.ValueDate?.ToString("yyyy-MM-dd") ?? "",
            MetadataType.select => m.Valuemetadata?.Name ?? "",
            _ => ""
        };
    }

    // 2. Метод для заполнения сущности из строки (используется в Create / Update)
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
                    m.ValuemetadataId = vId; // В rawValue должен приходить ID из справочника
                break;
        }
    }
}