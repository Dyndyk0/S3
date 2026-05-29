using Minio;
using Minio.DataModel.Args;
using XPEHb.Models.Dtos;

namespace XPEHb.Services;

public class MinioService
{
    private readonly IMinioClient _client;
    private readonly string _bucket;

    public MinioService(IMinioClient client, IConfiguration config)
    {
        _client = client;
        string? bucket = Environment.GetEnvironmentVariable("MINIO_BUCKET");
        _bucket = bucket ?? throw new ArgumentNullException(nameof(bucket));
    }

    // Уменьшить время жизни ссылки для загрузки (или нет)
    public async Task<string> GetUploadUrlAsync(string fileName, string minioEndpoint)
    {
        var args = new PresignedPutObjectArgs()
            .WithBucket(_bucket)
            .WithObject(fileName)
            .WithExpiry(600);
        string minioPutUrl = await _client.PresignedPutObjectAsync(args);
        return minioPutUrl.Replace($"http://{minioEndpoint}", "/api/minio");;
    }
    
    public async Task<string> GetDownloadUrlAsync(string fileLink, string fileName)
    {
        var args = new PresignedGetObjectArgs()
            .WithBucket(_bucket)
            .WithObject(fileLink)
            .WithExpiry(3600)
            .WithHeaders(new Dictionary<string, string> {
        { "response-content-disposition", "attachment; filename=" + fileName }
    });
        return await _client.PresignedGetObjectAsync(args);
    }

    public async Task RemoveFileAsync(string fileName)
    {
        var args = new RemoveObjectArgs().WithBucket(_bucket).WithObject(fileName);
        await _client.RemoveObjectAsync(args);
    }

    public async Task<List<MinioFileDto>> ListAllFilesAsync()
    {
        var files = new List<MinioFileDto>();
        try
        {
            // Настраиваем аргументы листинга (Recursive: true позволяет видеть файлы в подпапках)
            var listArgs = new ListObjectsArgs()
                .WithBucket(_bucket)
                .WithRecursive(true);

            // Используем IAsyncEnumerable для перебора объектов
            await foreach (var item in _client.ListObjectsEnumAsync(listArgs))
            {
                files.Add(new MinioFileDto(
                    item.Key, 
                    item.Size, 
                    item.LastModifiedDateTime
                ));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"MinIO List Error: {ex.Message}");
        }
        return files;
    }

    public IAsyncEnumerable<Minio.DataModel.Item> ListObjectsAsync()
    {
        var args = new ListObjectsArgs().WithBucket(_bucket).WithRecursive(true);
        return _client.ListObjectsEnumAsync(args);
    }
}