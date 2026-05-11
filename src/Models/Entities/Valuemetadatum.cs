using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class Valuemetadatum
{
    public int Id { get; set; }

    public int? KeymetadataId { get; set; }

    public string Name { get; set; } = null!;

    public virtual Keymetadatum? Keymetadata { get; set; }

    public virtual ICollection<Metadata> Metadata { get; set; } = new List<Metadata>();
}
