using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace XPEHb.Models;

[Table("file")]
public class FileEntity
{
    [Key, Column("id")]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("link")]
    public string Link { get; set; } = null!;

    [Column("last_updated")]
    public DateTime? LastUpdated { get; set; }

    [Column("is_uploaded")]
    public bool IsUploaded { get; set; }

    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    public virtual ICollection<Metadata> Metadatas { get; set; } = new List<Metadata>();
}

[Table("typemetadata")]
public class TypeMetadata
{
    [Key, Column("id")]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;
}

[Table("categorymetadata")]
public class CategoryMetadata
{
    [Key, Column("id")]
    public int Id { get; set; }

    [Column("typemetadata_id")]
    public int TypeMetadataId { get; set; }

    [ForeignKey(nameof(TypeMetadataId))]
    public virtual TypeMetadata Type { get; set; } = null!;

    [Column("name")]
    public string Name { get; set; } = null!;
}

[Table("metadata")]
public class Metadata
{
    [Key, Column("id")]
    public int Id { get; set; }

    [Column("file_id")]
    public int FileId { get; set; }

    [ForeignKey(nameof(FileId))]
    public virtual FileEntity File { get; set; } = null!;

    [Column("categorymetadata_id")]
    public int CategoryMetadataId { get; set; }

    [ForeignKey(nameof(CategoryMetadataId))]
    public virtual CategoryMetadata Category { get; set; } = null!;
}