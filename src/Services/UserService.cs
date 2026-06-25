using CommunityToolkit.HighPerformance.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using System.Text.Json;
using System.Globalization;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;
using XPEHb.Extensions;

namespace XPEHb.Services;
public class UserService
{
    private readonly MetaContext _db;

    public UserService(MetaContext db)
    {
        _db = db;
    }

    public async Task<(List<UserDto> items, int total)> GetUsersAsync(UserFilterDto filter)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrEmpty(filter.Name))
            query = query.Where(u => u.Name.Contains(filter.Name));
        if (!string.IsNullOrEmpty(filter.Role))
            query = query.Where(u => u.Userroles.Any(ur => ur.Role.Name == filter.Role));

        int total = await query.CountAsync();

        var users = await query
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 20)
            .OrderBy(u => u.Id)
            .Select(u => new UserDto(
                u.Id,
                u.Name,
                u.Userroles.Select(ur => new RoleDto(ur.Role.Id, ur.Role.Name)).ToList()
            ))
            .ToListAsync();

        return (users, total);
    }

    public async Task<UserAndRoleDto> GetMeAsync(string? userName)
    {
        if (string.IsNullOrEmpty(userName))
            throw new NotFoundException("User not found");

        UserAndRoleDto user = await _db.Users
            .Where(u => u.Name.ToLower() == userName.ToLower())
            .Select(u => new UserAndRoleDto(
                u.Name,
                u.Userroles.Select(ur => new RoleDto(ur.Role.Id, ur.Role.Name)).ToList()
            ))
            .FirstOrDefaultAsync() ?? throw new NotFoundException("User not found");

        return user;
    }

    public async Task ChangeUserRolesAsync(string userName, List<int> roleIds, bool? delete)
    {
        User user = await _db.Users.FirstOrDefaultAsync(u => u.Name == userName) ?? throw new NotFoundException("User not found");
        List<Userrole>? userRoles = await _db.Userroles.Where(ur => ur.UserId == user.Id).ToListAsync();

        if (delete == true)
        {
            _db.Userroles.RemoveRange(userRoles.Where(ur => roleIds.Contains(ur.RoleId)));
            await _db.SaveChangesAsync();
            return;
        }

        foreach (var roleId in roleIds)
        {
            if (!userRoles.Any(ur => ur.RoleId == roleId))
            {
                _db.Userroles.Add(new Userrole { UserId = user.Id, RoleId = roleId });
            }
        }

        await _db.SaveChangesAsync();
    }
}