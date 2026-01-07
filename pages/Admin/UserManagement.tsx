
import React, { useState } from 'react';
import { db } from '../../services/db';
import { User, UserRole, Client } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Key } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const clients = db.getClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: UserRole.CLIENT,
    clientId: ''
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: UserRole.CLIENT, clientId: clients[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.password) return;
    const userToSave: User = {
      id: editingUser?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      email: formData.email!,
      password: formData.password!,
      role: formData.role as UserRole,
      clientId: formData.role === UserRole.CLIENT ? formData.clientId : undefined,
      createdAt: editingUser?.createdAt || new Date().toISOString()
    };
    db.saveUser(userToSave);
    setUsers(db.getUsers());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-500">Administra accesos y contraseñas de tus clientes.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-3xl border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Password</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Rol</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                    <Key size={14} /> {user.password}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                    <button onClick={() => { if(window.confirm('¿Eliminar?')) { db.deleteUser(user.id); setUsers(db.getUsers()); } }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">Configurar Usuario</h3>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <div className="p-8 space-y-4">
              <input type="text" className="w-full border rounded-xl p-3" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre" />
              <input type="email" className="w-full border rounded-xl p-3" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Contraseña</label>
                <input type="text" className="w-full border rounded-xl p-3 font-mono" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Pass" />
              </div>
              <select className="w-full border rounded-xl p-3" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                <option value={UserRole.CLIENT}>Cliente</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
              {formData.role === UserRole.CLIENT && (
                <select className="w-full border rounded-xl p-3" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                  <option value="">Selecciona Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div className="px-8 py-6 border-t bg-gray-50 flex justify-end">
              <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">Guardar Acceso</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
