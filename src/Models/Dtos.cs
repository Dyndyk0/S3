using System.Text.Json.Serialization;
namespace XPEHb.Models;

public record TagDto(int TypeId, string Type, int CatId, string Cat);

public class FileViewDto {
    [JsonIgnore]
    public int Id { get; set; }
    public string Name { get; set; }
    public string Link { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    [JsonIgnore]
    public string? TagsRaw { get; set; } 
}

public record TagUploadModel(int TypeId, int CatId);
public record UploadRequest(string FileName, List<TagUploadModel> Tags);
public record MinioFileDto(string Key, ulong Size, DateTime? LastModified);