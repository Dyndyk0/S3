using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class Metadatatemplate
{
    public int Id { get; set; }

    public int KeymetadataId { get; set; }

    public int TemplateId { get; set; }

    public virtual Keymetadatum Keymetadata { get; set; } = null!;

    public virtual Template Template { get; set; } = null!;
}
