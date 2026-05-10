namespace XPEHb.Models.Dtos;


public record ValueMetadataDto(int Id, string Name);

public class ValueMetadataFilterDto
{
    public int Offset { get; set; } = 0;
    public int Limit { get; set; } = 100;
    public int? KeyId { get; set; }
    public string? Name { get; set; }
}