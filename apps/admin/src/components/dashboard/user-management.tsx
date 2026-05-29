'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Bike, 
  Store, 
  User, 
  Mail, 
  Phone, 
  Loader2, 
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';

type UserRole = 'customer' | 'rider' | 'vendor' | 'admin' | 'super_admin';

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'all' | UserRole>('all');
  
  // Queries
  const { data: usersData, isLoading, refetch } = trpc.admin.listUsers.useQuery({
    page,
    pageSize: 15,
    role: selectedRole === 'all' ? undefined : selectedRole,
  });

  // Mutations
  const toggleActiveMutation = trpc.admin.toggleUserActive.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleToggleUserActive = async (userId: string, role: string) => {
    if (role === 'super_admin') {
      alert('Security Policy Override: Cannot suspend a super_admin user.');
      return;
    }
    try {
      await toggleActiveMutation.mutateAsync({ userId });
    } catch (err: any) {
      console.error('Failed to change user status:', err);
      alert(err?.message || 'Error occurred while updating user status.');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'vendor':
        return <Store className="w-4 h-4 text-violet-400" />;
      case 'rider':
        return <Bike className="w-4 h-4 text-teal-400" />;
      default:
        return <User className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, string> = {
      super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
      admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      vendor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      rider: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      customer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    return map[role] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          User <span className="text-orange-500">Directory</span>
        </h1>
        <p className="text-slate-400 mt-1">Audit member profiles, modify account flags, and suspend users who breach security terms.</p>
      </div>

      {/* Role Filters */}
      <div className="flex bg-slate-900/30 border border-slate-800/80 rounded-2xl p-2 flex-wrap gap-1 max-w-2xl">
        {([
          { key: 'all', label: 'All Users' },
          { key: 'customer', label: 'Customers' },
          { key: 'vendor', label: 'Vendors' },
          { key: 'rider', label: 'Riders' },
          { key: 'admin', label: 'Admins' }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedRole(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === tab.key
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : !usersData?.data || usersData.data.length === 0 ? (
        <div className="h-[30vh] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/10">
          <Users className="w-10 h-10 mb-2.5 text-slate-600" />
          <p className="text-sm">No directory records found.</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Profile</th>
                  <th className="py-4 px-6">Contact Email</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Registered Date</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {usersData.data.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-950/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-slate-850 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="font-bold text-slate-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">{user.email}</td>
                    <td className="py-4 px-6 text-slate-400">{user.phone || 'N/A'}</td>
                    <td className="py-4 px-6 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getRoleBadge(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          ● Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
                          ● Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {user.role === 'super_admin' ? (
                        <span className="text-[10px] text-slate-600 font-semibold italic">Immune</span>
                      ) : (
                        <button
                          onClick={() => handleToggleUserActive(user.id, user.role)}
                          disabled={toggleActiveMutation.isPending && toggleActiveMutation.variables?.userId === user.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-40 ${
                            user.isActive
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-md'
                          }`}
                        >
                          {toggleActiveMutation.isPending && toggleActiveMutation.variables?.userId === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : user.isActive ? (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Suspend
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usersData.total > 15 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/40 border-t border-slate-800 text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
              >
                Previous Page
              </button>
              <span className="text-slate-400">Page <strong className="text-slate-200">{page}</strong> of {Math.ceil(usersData.total / 15)}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!usersData.hasNextPage}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
