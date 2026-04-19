using System.Text.Json.Serialization;
namespace XPEHb.Models;

public record TagDto(int TypeId, string Type, int CatId, string Cat); // Тут отправляются теги

// Тут отправка файла
public class FileViewDto {
    public int Id { get; set; }
    public string Name { get; set; }
    [JsonIgnore]
    public string Link { get; set; }
    public DateTime? LastUpdated { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    [JsonIgnore]
    public string? TagsRaw { get; set; } 
}

public record FileNameWithTags(string FileName, List<int> CategoryIds); // Это для создания файла
public record MinioFileDto(string Key, ulong Size, DateTime? LastModified); // Это для отладки

public record MinioWebhookPayload(string EventName, List<MinioRecord> Records);

public class MinioRecord
{
    public MinioS3 s3 { get; set; }
}

public class MinioS3
{
    public MinioObject @object { get; set; }
}

public class MinioObject
{
    public string key { get; set; }
    public long size { get; set; }
}

public record SearchDto(int TypeId, string Category);

public class FileFilterRequest
{
    public int Offset { get; set; } // С какой записи начинать (Start)
    public int Limit { get; set; }  // Сколько записей брать (End - Start)
    public DateTime? DateFrom { get; set; } // Начало диапазона (или конкретная дата)
    public DateTime? DateTo { get; set; }   // Конец диапазона
    public List<SearchDto>? Tags { get; set; } // Теги
}
