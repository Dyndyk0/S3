using System;
using System.Collections.Generic;

namespace XPEHb.src.Models.Entities;

public partial class Template
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Metadatatemplate> Metadatatemplates { get; set; } = new List<Metadatatemplate>();
}
