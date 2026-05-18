namespace XPEHb.Models.Dtos;

public record KeyWithValuesMetadataDto(int Id, string? Name, List<ValueMetadataDto> Values);
public record KeyMetadataDto(int Id, string Name);
public record KeyMetadataFilterDto(int? Offset, int? Limit, string? Name);
