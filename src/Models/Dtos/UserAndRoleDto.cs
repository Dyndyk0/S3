using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace XPEHb.Models.Dtos;

public record UserDto(int Id, string Name, List<RoleDto> Roles);
public record UserFilterDto(int? Offset, int? Limit, string? Name, string? Role);
public record UserAndRoleDto(string Name, List<RoleDto> Roles);
public record RoleFilterDto(int? Offset, int? Limit, string? Name);
public record RoleDto(int Id, string Name);
public record RolePatchDto(List<int> RoleIds, bool? Delete);