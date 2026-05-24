namespace XPEHb.Middlewares;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseMockAuth(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<MockAuthMiddleware>();
    }

    public static IApplicationBuilder UseResponseHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ResponseHeadersMiddleware>();
    }
}