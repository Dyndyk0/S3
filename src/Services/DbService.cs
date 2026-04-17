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
        _connectionString = config.GetValue<string>("HOST_STRING") ?? Environment.GetEnvironmentVariable("HOST_STRING")!;
    }

    private NpgsqlConnection CreateConnection() => new NpgsqlConnection(_connectionString);

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
            LEFT JOIN CategoryMetadata c ON m.categoryMetadata_id = c.id
            LEFT JOIN TypeMetadata t ON c.typeMetadata_id = t.id
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
    
    public async Task<string?> GetLinkByIdAsync(int fileId) {
        using var db = CreateConnection();
        var files = await db.QueryAsync<FileEntity>("SELECT link FROM File WHERE id = @fileId", new { fileId });
        FileEntity? file = files.FirstOrDefault();
        return files.FirstOrDefault()?.Link;
    }

    public async Task<string> InitFileMetadataAsync(string fileName, List<int> categoryIds)
    {
        categoryIds ??= new List<int>();
        using IDbConnection db = CreateConnection();
        db.Open();
        using IDbTransaction trans = db.BeginTransaction();
        try
        {
            var fileId = await db.QuerySingleAsync<int>(
                @"INSERT INTO File (name, link, last_updated, is_uploaded, is_deleted) 
                VALUES (@name, 'temp_link', NOW(), false, false) RETURNING id",
                new { name = fileName }, transaction: trans);

            string link = $"{fileId}_{fileName}";

            await db.ExecuteAsync(
                "UPDATE File SET link = @link WHERE id = @id",
                new { link, id = fileId }, transaction: trans);

            foreach (var catId in categoryIds)
            {
                await db.ExecuteAsync(
                    "INSERT INTO Metadata (file_id, categoryMetadata_id) VALUES (@fileId, @catId)",
                    new { fileId, catId }, transaction: trans);
            }
            trans.Commit();
            
            return link;
        }
        catch (Exception ex)
        {
            trans.Rollback();
            Console.WriteLine($"Database Error: {ex.Message}");
            throw;
        }
    }

    public async Task ConfirmUploadByLinkAsync(string link)
    {
        using IDbConnection db = CreateConnection();
        await db.ExecuteAsync(
            "UPDATE File SET is_uploaded = true, last_updated = NOW() WHERE link = @link",
            new { link });
    }

    public async Task DeleteFileAsync(string filename)
    {
        using var db = CreateConnection();
        await db.ExecuteAsync("DELETE FROM Metadata WHERE file_id IN (SELECT id FROM File WHERE link = @filename)", new { filename });
        await db.ExecuteAsync("DELETE FROM File WHERE link = @filename", new { filename });
    }

    public async Task CreateTypeAsync(string name) {
        using var db = CreateConnection();
        await db.ExecuteAsync("INSERT INTO TypeMetadata (name) VALUES (@name)", new { name });
    }

    public async Task CreateCategoryAsync(int typeId, string name) {
        using var db = CreateConnection();
        await db.ExecuteAsync("INSERT INTO CategoryMetadata (typeMetadata_id, name) VALUES (@typeId, @name)", new { typeId, name });
    }
}