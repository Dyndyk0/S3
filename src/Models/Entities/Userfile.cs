using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class Userfile
{
    public int Id { get; set; }

    public int? FileId { get; set; }

    public int? UserId { get; set; }

    public virtual File? File { get; set; }

    public virtual User? User { get; set; }
}
