import React, { useEffect, useState } from 'react';
import { usersApi, rolesApi } from '../services/api';
import { UserDto, RoleDto } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Shield } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [newRoleName, setNewRoleName] = useState('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        usersApi.getUsers({ Limit: 100 }),
        rolesApi.getRoles({ Limit: 100 })
      ]);
      
      const usersData = uRes && uRes.items ? uRes.items : (Array.isArray(uRes) ? uRes : []);
      const rolesData = rRes && rRes.items ? rRes.items : (Array.isArray(rRes) ? rRes : []);
      
      setUsers(usersData);
      setRoles(rolesData);
    } catch (e) {
      console.error(e);
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const openRolesModal = (u: UserDto) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const toggleRole = async (role: RoleDto, currentlyHasRole: boolean) => {
    if (!selectedUser) return;
    try {
      setUpdating(true);
      const payload = {
        roleIds: [role.id],
        delete: currentlyHasRole
      };
      await usersApi.updateUserRoles(selectedUser.name, payload);
      
      // Optimizely update local state
      const newUserRoles = currentlyHasRole 
         ? (selectedUser.roles || []).filter(r => r.id !== role.id)
         : [...(selectedUser.roles || []), role];
      
      const updatedUser = { ...selectedUser, roles: newUserRoles };
      setSelectedUser(updatedUser);
      setUsers(users.map(u => u.name === selectedUser.name ? updatedUser : u));
      
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data || 'Ошибка при изменении ролей пользователя');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      setUpdating(true);
      await rolesApi.createRole(newRoleName.trim());
      setNewRoleName('');
      setIsRoleModalOpen(false);
      fetchUsersAndRoles();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data || 'Ошибка при создании роли');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Пользователи</h2>
          <p className="text-slate-500 mt-1">Управление пользователями и их ролями (для администраторов)</p>
        </div>
        <Button onClick={() => setIsRoleModalOpen(true)} className="gap-2">
          <Shield className="w-4 h-4" /> Добавить роль
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">Имя пользователя</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">Роли</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles?.map(r => (
                          <span key={r.name} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                            {r.name}
                          </span>
                        ))}
                        {(!u.roles || u.roles.length === 0) && '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50" onClick={() => openRolesModal(u)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Управление ролями
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      <p>Пользователи не найдены или у вас нет доступа.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Управление ролями - ${selectedUser?.name}`}
      >
         <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-500 mb-4">Отметьте роли, которые должны быть назначены этому пользователю.</p>
            <div className="space-y-2">
               {roles.map(r => {
                  const hasRole = selectedUser?.roles?.some(ur => ur.name === r.name) || false;
                  return (
                     <label key={r.name} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <input 
                           type="checkbox" 
                           checked={hasRole}
                           disabled={updating}
                           onChange={() => toggleRole(r, hasRole)}
                           className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <span className="text-sm font-medium text-slate-800">{r.name}</span>
                     </label>
                  );
               })}
               {roles.length === 0 && (
                  <p className="text-sm text-slate-500">Доступные роли не найдены.</p>
               )}
            </div>
         </div>
         <div className="mt-6 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>Закрыть</Button>
         </div>
      </Modal>

      <Modal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
        title="Создать новую роль"
        footer={<Button onClick={handleCreateRole} disabled={!newRoleName.trim() || updating}>{updating ? 'Создание...' : 'Создать'}</Button>}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Название роли</label>
            <input 
              type="text" 
              value={newRoleName} 
              onChange={e => setNewRoleName(e.target.value)} 
              placeholder="Введите название (например, manager)..." 
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
