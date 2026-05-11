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

    public virtual DbSet<Template> Templates { get; set; }

    public virtual DbSet<Valuemetadatum> Valuemetadata { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Server=localhost;Port=5432;Database=Meta;Username=postgresadmin;Password=postgresadmin");

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
        });

        modelBuilder.Entity<Keymetadatum>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("keymetadata_pkey");

            entity.ToTable("keymetadata");

            entity.Property(e => e.Id).HasColumnName("id");
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
            entity.Property(e => e.ValuemetadataId).HasColumnName("valuemetadata_id");

            entity.HasOne(d => d.File).WithMany(p => p.Metadata)
                .HasForeignKey(d => d.FileId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("metadata_file_id_fkey");

            entity.HasOne(d => d.Valuemetadata).WithMany(p => p.Metadata)
                .HasForeignKey(d => d.ValuemetadataId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("metadata_valuemetadata_id_fkey");
        });

        modelBuilder.Entity<Metadatatemplate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("metadatatemplate_pkey");

            entity.ToTable("metadatatemplate");

            entity.Property(e => e.Id).HasColumnName("id");
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

        modelBuilder.Entity<Template>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("template_pkey");

            entity.ToTable("template");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .HasColumnName("name");
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
