using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using XPEHb.Models.Entities;
using XPEHb.Models.Dtos;
using XPEHb.Services;

namespace XPEHb.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("auth");
        group.MapPost("/login", async (LoginRequest request, AuthService authService, HttpContext httpContext) =>
        {
            return await authService.LoginAsync(request.UserName, request.Password, httpContext);
        })
        .AllowAnonymous();

        group.MapPost("/logout", async (HttpContext httpContext) =>
        {
            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok();
        });
    }
}