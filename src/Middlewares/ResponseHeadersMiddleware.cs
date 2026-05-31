using System.Security.Claims;

namespace XPEHb.Middlewares;

public class ResponseHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public ResponseHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            string currentUserId = context.User.Identity?.Name ?? "-";
            context.Response.Headers["X-User-Id"] = Uri.EscapeDataString(currentUserId);

            if (context.Items.TryGetValue("LogFileName", out var fileNameObj) && fileNameObj is string fileName)
            {
                context.Response.Headers["X-File-Name"] = Uri.EscapeDataString(fileName);
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}