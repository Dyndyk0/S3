namespace XPEHb.Models.Dtos;


public record TemplateDto(int Id, string Name);
public record TemplateDetailDto(int Id, string Name, List<TemplateFieldDto> Fields);
public record TemplateFieldDto(int KeyId, string KeyName, List<ValueMetadataDto> Values);
public record CreateTemplateDto(string? Name, List<int>? KeyIds);

// Filter DTO for template listing (search, pagination, sorting)
public record TemplateFilterDto
{
	public string? Name { get; init; }
	public int? Offset { get; init; }
	public int? Limit { get; init; }
}