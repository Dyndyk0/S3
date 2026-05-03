using System;
using System.Collections.Generic;

namespace XPEHb.src.Models.Entities;

public partial class File
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Link { get; set; } = null!;

    public DateTime? LastUpdated { get; set; }

    public bool IsUploaded { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<Metadata> Metadata { get; set; } = new List<Metadata>();
}
