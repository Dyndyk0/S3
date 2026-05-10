namespace XPEHb.Models.Dtos;


public record TemplateDto(int Id, string Name);
public record TemplateDetailDto(int Id, string Name, List<TemplateFieldDto> Fields);
public record TemplateFieldDto(int KeyId, string KeyName, List<ValueMetadataDto> Values);
public record CreateTemplateDto(string Name, List<int> KeyIds);