using Microsoft.EntityFrameworkCore;
using XPEHb.Models;

public class MyDbContext : DbContext
{
    public DbSet<FileEntity> Files { get; set; }
    public DbSet<Metadata> Metadatas { get; set; }
    public DbSet<CategoryMetadata> Categories { get; set; }
    public DbSet<TypeMetadata> Types { get; set; }

    public MyDbContext(DbContextOptions<MyDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}