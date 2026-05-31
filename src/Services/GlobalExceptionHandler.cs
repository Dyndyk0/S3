using Microsoft.AspNetCore.Diagnostics;
// Обязательно добавьте этот using для логгера
using Microsoft.Extensions.Logging; 

namespace XPEHb.Services;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    // Внедряем логгер через конструктор
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, errorMessage) = exception switch
        {
            ValidationException validationEx => (StatusCodes.Status400BadRequest, validationEx.Message),
            NotFoundException notFoundEx => (StatusCodes.Status404NotFound, notFoundEx.Message),
            _ => (StatusCodes.Status500InternalServerError, "Внутренняя ошибка сервера")
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(exception, "Произошла необработанная ошибка: {Message}", exception.Message);
        }

        httpContext.Response.StatusCode = statusCode;
        
        await httpContext.Response.WriteAsJsonAsync(new
        {
            Error = errorMessage,
            StatusCode = statusCode,
            // Для удобства отладки можно временно возвращать текст системной ошибки в Postman
            Details = exception.Message 
        }, cancellationToken);

        return true; 
    }
}