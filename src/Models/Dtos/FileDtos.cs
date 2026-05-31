using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace XPEHb.Models.Dtos;


public record TagDto(int? KeyId, string? Key, int? ValueId, string Value);
public record FileDto {
    public int Id { get; set; }
    public int? TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public string? Creator { get; set; }
    public string? LastEditor { get; set; }
    public string? Name { get; set; }
    public string? FileExtension { get; set; }
    [JsonIgnore]
    public string? Link { get; set; }
    public DateTime? DateUpload { get; set; }
    public DateTime? LastUpdated { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    //[JsonIgnore]
    //public string? TagsRaw { get; set; } 
}

public record FileInitDto(int? TemplateId, string FileName, string FileExtension, List<FileTagInitDto>? Tags);
public record FileTagInitDto(int KeyId, string Value);
public record FileUpdateDto(int? TemplateId, string FileName, string FileExtension, bool? UpdateFile, List<FileTagInitDto>? Tags);
public record TagFilterDto(int KeyId, string Value);
public record FileFilterDto(
    int? Offset,
    int? Limit,
    int? TemplateId,
    string? FileName,
    string? FileExtension,
    DateTime? DateUploadFrom,
    DateTime? DateUploadTo,
    DateTime? LastUpdatedFrom,
    DateTime? LastUpdatedTo,
    string? TagsJson,
    [FromQuery]
    int[]? TagIds,
    string? SortBy,
    bool SortDescending = true,
    bool VisibleDeleted = false
);