namespace XPEHb.Models.Dtos;


public record ValueMetadataDto(int Id, string Name, int? KeyId = null);
public record ValueMetadataFilterDto(int? Offset, int? Limit, int? KeyId, string? Name);
public record UpdateValueMetadataDto(int Id, string Name);