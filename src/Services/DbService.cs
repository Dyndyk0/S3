using Dapper;
using Npgsql;
using System.Data;
using XPEHb.Models;
using System.Text.Json;

namespace XPEHb.Services;

public class DbService
{
    private readonly string _connectionString;

    public DbService(IConfiguration config)
    {
        _connectionString = config.GetValue<string>("HOST_STRING") 
            ?? Environment.GetEnvironmentVariable("HOST_STRING")!;
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<(IEnumerable<TypeMetadata> types, IEnumerable<CategoryMetadata> cats)> GetMetadataAsync()
    {
        using var db = CreateConnection();
        var types = await db.QueryAsync<TypeMetadata>("SELECT id, name FROM TypeMetadata");
        var cats = await db.QueryAsync<CategoryMetadata>("SELECT id, name, typeMetadata_id as TypeMetadataId FROM CategoryMetadata");
        return (types, cats);
    }

    public async Task<IEnumerable<FileViewDto>> GetFilesAsync()
    {
        using var db = CreateConnection();
        string sql = @"
            SELECT f.id, f.name, f.link,
                   json_agg(json_build_object(
                        'TypeId', t.id, 'Type', t.name, 
                        'CatId', c.id, 'Cat', c.name
                   )) as TagsRaw
            FROM File f
            LEFT JOIN Metadata m ON f.id = m.file_id
            LEFT JOIN TypeMetadata t ON m.typeMetadata_id = t.id
            LEFT JOIN CategoryMetadata c ON m.categoryMetadata_id = c.id
            GROUP BY f.id, f.name, f.link";

        var result = await db.QueryAsync<FileViewDto>(sql);
        
        foreach (var file in result)
        {
            if (!string.IsNullOrEmpty(file.TagsRaw) && file.TagsRaw != "[{\"TypeId\" : null, \"Type\" : null, \"CatId\" : null, \"Cat\" : null}]")
            {
                file.Tags = JsonSerializer.Deserialize<List<TagDto>>(file.TagsRaw, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
            }
        }
        return result;
    }

    public async Task SaveFileMetadataAsync(string fileName, string storagePath, List<int> categoryIds)
    {
        categoryIds ??= new List<int>();
        using var db = CreateConnection();
        db.Open();
        using var trans = db.BeginTransaction();
        try
        {
            // 1. Создаем запись в File
            var fileId = await db.QuerySingleAsync<int>(
                "INSERT INTO File (name, link, is_deleted) VALUES (@name, @link, @is_deleted) RETURNING id",
                new { name = fileName, link = storagePath, is_deleted = false}, transaction: trans);

            // 2. Создаем связи в Metadata для каждой категории
            foreach (var catId in categoryIds)
            {
                // Сначала узнаем TypeId для этой категории
                var typeId = await db.QuerySingleAsync<int>(
                    "SELECT typeMetadata_id FROM CategoryMetadata WHERE id = @catId", new { catId }, transaction: trans);

                await db.ExecuteAsync(
                    "INSERT INTO Metadata (file_id, typeMetadata_id, categoryMetadata_id) VALUES (@fileId, @typeId, @catId)",
                    new { fileId, typeId, catId }, transaction: trans);
            }
            trans.Commit();
        }
        catch (Exception ex)
        {
            trans.Rollback();
            Console.WriteLine($"Database Error: {ex.Message}");
            throw;
        }
    }

    public async Task DeleteFileAsync(string filename)
    {
        using var db = CreateConnection();
        // Удаляем сначала из Metadata (из-за FK), потом из File
        await db.ExecuteAsync("DELETE FROM Metadata WHERE file_id IN (SELECT id FROM File WHERE link = @filename)", new { filename });
        await db.ExecuteAsync("DELETE FROM File WHERE link = @filename", new { filename });
    }
}