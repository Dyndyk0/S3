using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace XPEHb.Models.Dtos;


public record TagDto(int? KeyId, string? Key, int ValueId, string Value);
public class FileDto {
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? FileExtension { get; set; }
    [JsonIgnore]
    public string? Link { get; set; }
    public DateTime? DateUpload { get; set; }
    public DateTime? LastUpdated { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    [JsonIgnore]
    public string? TagsRaw { get; set; } 
}

public record FileInitDto(string FileName, string FileExtension, List<int> ValueIds);
public record FileUpdateDto(string FileName, string FileExtension, bool? UpdateFile, List<int>? ValueIds);
public record TagFilterDto(int KeyId, string Value);
public record FileFilterDto(
    int? Offset,
    int? Limit,
    DateTime? DateFrom,
    DateTime? DateTo,
    string? TagsJson,
    [FromQuery]
    int[]? TagIds,
    string? SortBy,
    bool SortDescending = true
);