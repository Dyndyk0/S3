using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class Template
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<File> Files { get; set; } = new List<File>();

    public virtual ICollection<Metadatatemplate> Metadatatemplates { get; set; } = new List<Metadatatemplate>();
}
