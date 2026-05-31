using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class User
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<File> FileCreators { get; set; } = new List<File>();

    public virtual ICollection<File> FileLastEditors { get; set; } = new List<File>();

    public virtual ICollection<Userrole> Userroles { get; set; } = new List<Userrole>();
}
