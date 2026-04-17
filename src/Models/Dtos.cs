using System.Text.Json.Serialization;
namespace XPEHb.Models;

public record TagDto(int TypeId, string Type, int CatId, string Cat);

public class FileViewDto {
    public int Id { get; set; }
    public string Name { get; set; }
    [JsonIgnore]
    public string Link { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    [JsonIgnore]
    public string? TagsRaw { get; set; } 
}

public record TagUploadModel(int TypeId, int CatId);
public record FileNameWithTags(string FileName, List<int> CategoryIds);
public record MinioFileDto(string Key, ulong Size, DateTime? LastModified);

public class MinioWebhookPayload
{
    public string EventName { get; set; }
    public List<MinioRecord> Records { get; set; }
}

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
    public string key { get; set; } // Это и есть наш link! (например, 12_резюме.pdf)
    public long size { get; set; }
}