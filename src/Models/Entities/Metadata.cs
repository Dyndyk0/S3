using System;
using System.Collections.Generic;

namespace XPEHb.src.Models.Entities;

public partial class Metadata
{
    public int Id { get; set; }

    public int FileId { get; set; }

    public int ValuemetadataId { get; set; }

    public virtual File File { get; set; } = null!;

    public virtual Valuemetadatum Valuemetadata { get; set; } = null!;
}
