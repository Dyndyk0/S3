using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace XPEHb.Models.Entities;

public partial class MetaContext : DbContext
{
    public MetaContext()
    {
    }

    public MetaContext(DbContextOptions<MetaContext> options)
        : base(options)
    {
    }

    public virtual DbSet<File> Files { get; set; }

    public virtual DbSet<Keymetadatum> Keymetadata { get; set; }

    public virtual DbSet<Metadata> Metadata { get; set; }

    public virtual DbSet<Metadatatemplate> Metadatatemplates { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Template> Templates { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Userfile> Userfiles { get; set; }

    public virtual DbSet<Valuemetadatum> Valuemetadata { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseNpgsql(Environment.GetEnvironmentVariable("HOST_STRING"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<File>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("file_pkey");

            entity.ToTable("file");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DateUpload)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("date_upload");
            entity.Property(e => e.FileExtension)
                .HasMaxLength(255)
                .HasColumnName("file_extension");
            entity.Property(e => e.IsDeleted).HasColumnName("is_deleted");
            entity.Property(e => e.IsUploaded).HasColumnName("is_uploaded");
            entity.Property(e => e.LastUpdated)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("last_updated");
            entity.Property(e => e.Link)
                .HasMaxLength(255)
                .HasColumnName("link");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
            entity.Property(e => e.TemplateId).HasColumnName("template_id");

            entity.HasOne(d => d.Template).WithMany(p => p.Files)
                .HasForeignKey(d => d.TemplateId)
                .HasConstraintName("file_template_id_fkey");
        });

        modelBuilder.Entity<Keymetadatum>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("keymetadata_pkey");

            entity.ToTable("keymetadata");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DataType)
                .HasMaxLength(50)
                .HasDefaultValueSql("'text'::character varying")
                .HasColumnName("data_type");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Metadata>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("metadata_pkey");

            entity.ToTable("metadata");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FileId).HasColumnName("file_id");
            entity.Property(e => e.KeymetadataId).HasColumnName("keymetadata_id");
            entity.Property(e => e.ValueBoolean).HasColumnName("value_boolean");
            entity.Property(e => e.ValueDate)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("value_date");
            entity.Property(e => e.ValueNumber).HasColumnName("value_number");
            entity.Property(e => e.ValueString).HasColumnName("value_string");
            entity.Property(e => e.ValuemetadataId).HasColumnName("valuemetadata_id");

            entity.HasOne(d => d.File).WithMany(p => p.Metadata)
                .HasForeignKey(d => d.FileId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("metadata_file_id_fkey");

            entity.HasOne(d => d.Keymetadata).WithMany(p => p.Metadata)
                .HasForeignKey(d => d.KeymetadataId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("metadata_keymetadata_id_fkey");

            entity.HasOne(d => d.Valuemetadata).WithMany(p => p.Metadata)
                .HasForeignKey(d => d.ValuemetadataId)
                .HasConstraintName("metadata_valuemetadata_id_fkey");
        });

        modelBuilder.Entity<Metadatatemplate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("metadatatemplate_pkey");

            entity.ToTable("metadatatemplate");

            entity.HasIndex(e => new { e.KeymetadataId, e.TemplateId }, "metadatatemplate_keymetadata_id_template_id_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IsMultiple).HasColumnName("is_multiple");
            entity.Property(e => e.IsRequired).HasColumnName("is_required");
            entity.Property(e => e.KeymetadataId).HasColumnName("keymetadata_id");
            entity.Property(e => e.TemplateId).HasColumnName("template_id");

            entity.HasOne(d => d.Keymetadata).WithMany(p => p.Metadatatemplates)
                .HasForeignKey(d => d.KeymetadataId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("metadatatemplate_keymetadata_id_fkey");

            entity.HasOne(d => d.Template).WithMany(p => p.Metadatatemplates)
                .HasForeignKey(d => d.TemplateId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("metadatatemplate_template_id_fkey");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("role_pkey");

            entity.ToTable("role");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Template>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("template_pkey");

            entity.ToTable("template");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("_user_pkey");

            entity.ToTable("_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Login)
                .HasMaxLength(255)
                .HasColumnName("login");
        });

        modelBuilder.Entity<Userfile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("userfile_pkey");

            entity.ToTable("userfile");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FileId).HasColumnName("file_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.File).WithMany(p => p.Userfiles)
                .HasForeignKey(d => d.FileId)
                .HasConstraintName("userfile_file_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Userfiles)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("userfile_user_id_fkey");
        });

        modelBuilder.Entity<Valuemetadatum>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("valuemetadata_pkey");

            entity.ToTable("valuemetadata");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.KeymetadataId).HasColumnName("keymetadata_id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");

            entity.HasOne(d => d.Keymetadata).WithMany(p => p.Valuemetadata)
                .HasForeignKey(d => d.KeymetadataId)
                .HasConstraintName("valuemetadata_keymetadata_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
