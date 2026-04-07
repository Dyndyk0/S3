namespace XPEHb.Models;

public class FileEntity {
    public int Id { get; set; }
    public string Name { get; set; }
    public string Link { get; set; }
    public bool IsDeleted { get; set; }
}

public class TypeMetadata {
    public int Id { get; set; }
    public string Name { get; set; }
}

public class CategoryMetadata {
    public int Id { get; set; }
    public int TypeMetadataId { get; set; }
    public string Name { get; set; }
}