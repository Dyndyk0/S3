using CommunityToolkit.HighPerformance.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using System.Text.Json;
using System.Globalization;
using XPEHb.Models.Dtos;
using XPEHb.Models.Entities;
using XPEHb.Extensions;

namespace XPEHb.Services;
public class RoleService
{
    private readonly MetaContext _db;

    public RoleService(MetaContext db)
    {
        _db = db;
    }

    public async Task<(List<RoleDto> items, int total)> GetRolesAsync(RoleFilterDto filter)
    {
        var query = _db.Roles.AsQueryable();

        if (!string.IsNullOrEmpty(filter.Name))
            query = query.Where(r => r.Name.Contains(filter.Name));

        int total = await query.CountAsync();

        var roles = await query
            .Skip(filter.Offset ?? 0)
            .Take(filter.Limit ?? 20)
            .Select(r => new RoleDto(
            
                r.Id,
                r.Name
            ))
            .ToListAsync();

        return (roles, total);
    }

    public async Task CreateRolesAsync(string name)
    {
        var role = new Role { Name = name };
        _db.Roles.Add(role);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteRolesAsync(List<int> ids)
    {
        var Roles = await _db.Roles.Include(r => r.Userroles).FirstOrDefaultAsync(r => ids.Contains(r.Id));
        if (Roles != null)
        {
            _db.Userroles.RemoveRange(Roles.Userroles);
            _db.Roles.Remove(Roles);
        }
        
        await _db.SaveChangesAsync();
    }
}