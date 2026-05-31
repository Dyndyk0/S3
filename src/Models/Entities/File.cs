using System;
using System.Collections.Generic;

namespace XPEHb.Models.Entities;

public partial class File
{
    public int Id { get; set; }

    public int? TemplateId { get; set; }

    public int CreatorId { get; set; }

    public int LastEditorId { get; set; }

    public string Name { get; set; } = null!;

    public string FileExtension { get; set; } = null!;

    public string Link { get; set; } = null!;

    public DateTime? DateUpload { get; set; }

    public DateTime? LastUpdated { get; set; }

    public bool IsUploaded { get; set; }

    public bool IsDeleted { get; set; }

    public virtual User Creator { get; set; } = null!;

    public virtual User LastEditor { get; set; } = null!;

    public virtual ICollection<Metadata> Metadata { get; set; } = new List<Metadata>();

    public virtual Template? Template { get; set; }
}
