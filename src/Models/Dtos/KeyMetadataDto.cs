using XPEHb.Models.Entities;
namespace XPEHb.Models.Dtos;

public record KeyWithValuesMetadataDto(int Id, string? Name, List<ValueMetadataDto> Values);
public record KeyMetadataFilterDto(int? Offset, int? Limit, string? Name, MetadataType? DataType);
public record KeyMetadataDto(int Id, string Name, string DataType);
public record PutKeyMetadataDto(int Id, string Name);