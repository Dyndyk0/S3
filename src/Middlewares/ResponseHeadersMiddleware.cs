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
            // Берем имя пользователя из контекста (которое запишет MockAuthMiddleware)
            // Если пользователя нет, оставляем заглушку
            string currentUserId = context.User?.Identity?.Name ?? "Zaglushka";
            context.Response.Headers["X-User-Id"] = currentUserId;

            if (context.Items.TryGetValue("LogFileName", out var fileNameObj) && fileNameObj is string fileName)
            {
                context.Response.Headers["X-File-Name"] = Uri.EscapeDataString(fileName);
            }

            return Task.CompletedTask;
        });

        await _next(context);
    }
}