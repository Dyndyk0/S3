namespace XPEHb.Models.Dtos;

public record KeyWithValuesMetadataDto(int Id, string? Name, List<ValueMetadataDto> Values);
public record KeyMetadataDto(int Id, string? Name);

public class KeyMetadataFilterDto
{
    public int Offset { get; set; } = 0;
    public int Limit { get; set; } = 100;
    public string? Name { get; set; }
}
