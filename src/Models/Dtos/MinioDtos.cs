namespace XPEHb.Models.Dtos;


public record MinioFileDto(string Key, ulong Size, DateTime? LastModified); // Это для отладки

public record MinioWebhookDto(string EventName, List<MinioRecord> Records);
public record MinioRecord(MinioS3 s3);
public record MinioS3(MinioObject @object);
public record MinioObject(string key, long size);