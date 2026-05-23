using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class Metadata
{
    public int Id { get; set; }

    public int FileId { get; set; }

    public int KeymetadataId { get; set; }

    public string? ValueString { get; set; }

    public double? ValueNumber { get; set; }

    public bool? ValueBoolean { get; set; }

    public DateTime? ValueDate { get; set; }

    public int? ValuemetadataId { get; set; }

    public virtual File File { get; set; } = null!;

    public virtual Keymetadatum Keymetadata { get; set; } = null!;

    public virtual Valuemetadatum? Valuemetadata { get; set; }
}
