using Microsoft.AspNetCore.Diagnostics;

namespace XPEHb.Services;

public class GlobalExceptionHandler : IExceptionHandler
{
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

        if (statusCode != StatusCodes.Status500InternalServerError)
        {
            httpContext.Response.StatusCode = statusCode;
            
            await httpContext.Response.WriteAsJsonAsync(new
            {
                Error = errorMessage,
                StatusCode = statusCode
            }, cancellationToken);

            return true;
        }

        return false;
    }
}