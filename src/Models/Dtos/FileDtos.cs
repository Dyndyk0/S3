using System.Text.Json.Serialization;

namespace XPEHb.Models.Dtos;


public record TagDto(int? KeyId, string? Key, int ValueId, string Value);
public class FileDto {
    public int Id { get; set; }
    public string? Name { get; set; }
    [JsonIgnore]
    public string? Link { get; set; }
    public DateTime? LastUpdated { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    [JsonIgnore]
    public string? TagsRaw { get; set; } 
}

public record FileInitDto(string FileName, List<int> ValueIds);
public record TagFilterDto(int KeyId, string Value);
public record FileFilterDto(
    int? Offset,
    int? Limit,
    DateTime? DateFrom,
    DateTime? DateTo,
    string? TagsJson
);