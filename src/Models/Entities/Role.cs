using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class Role
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Userrole> Userroles { get; set; } = new List<Userrole>();
}
