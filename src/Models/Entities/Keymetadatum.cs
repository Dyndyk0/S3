using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class Keymetadatum
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string DataType { get; set; } = null!;

    public virtual ICollection<Metadata> Metadata { get; set; } = new List<Metadata>();

    public virtual ICollection<Metadatatemplate> Metadatatemplates { get; set; } = new List<Metadatatemplate>();

    public virtual ICollection<Valuemetadatum> Valuemetadata { get; set; } = new List<Valuemetadatum>();
}
