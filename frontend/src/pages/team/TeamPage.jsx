import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, Trash2, Mail } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { TableRowSkeleton } from '../../components/common/SkeletonLoader';
import workspaceService from '../../services/workspaceService';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const TeamPage = () => {
  const { currentWorkspace, isOwnerOrAdmin } = useWorkspace();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const data = await workspaceService.getMembers(currentWorkspace.slug);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) return;

    try {
      setInviteLoading(true);
      const newMember = await workspaceService.addMember(currentWorkspace.slug, {
        username_or_email: inviteIdentifier.trim(),
        role: inviteRole,
      });
      success(`Added ${newMember.user.username} to the workspace!`);
      setMembers((prev) => [...prev, newMember]);
      setInviteIdentifier('');
      setInviteRole('MEMBER');
      setInviteModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.user?.[0] || 'Failed to add member.';
      error(msg);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const updated = await workspaceService.updateMemberRole(currentWorkspace.slug, memberId, newRole);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      success(`Role updated to ${newRole}`);
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to change role.');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      setRemoveLoading(true);
      await workspaceService.removeMember(currentWorkspace.slug, memberToRemove.id);
      success(`Removed ${memberToRemove.user.username} from workspace.`);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setMemberToRemove(null);
    } catch (err) {
      error('Failed to remove member.');
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Team & Access Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage workspace roles and member permissions (Owner, Admin, Member, Viewer)
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setInviteModalOpen(true)}
          >
            Add Team Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-6">
            <TableRowSkeleton count={4} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Title & Department</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Joined</th>
                  {isOwnerOrAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => {
                  const isSelf = m.user.id === user?.id;
                  const isOwner = m.role === 'OWNER';

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {m.user.profile?.avatar_url ? (
                            <img
                              src={m.user.profile.avatar_url}
                              alt={m.user.username}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs">
                              {m.user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : m.user.username}
                              {isSelf && (
                                <span className="text-[10px] text-indigo-400 font-normal">(You)</span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{m.user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-slate-200 font-medium">{m.user.profile?.job_title || 'Software Engineer'}</p>
                        <p className="text-[11px] text-slate-500">{m.user.profile?.department || 'Engineering'}</p>
                      </td>

                      <td className="px-6 py-4">
                        {isOwnerOrAdmin && !isOwner ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        ) : (
                          <Badge variant={m.role} size="sm">
                            {m.role}
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </td>

                      {isOwnerOrAdmin && (
                        <td className="px-6 py-4 text-right">
                          {!isOwner && !isSelf && (
                            <button
                              onClick={() => setMemberToRemove(m)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="Remove member"
                              aria-label="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Add Team Member"
        subtitle="Invite an existing developer by their username or email to collaborate on this workspace."
      >
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <Input
            label="Username or Email"
            placeholder="e.g. sophia@codealpha.io or marcus"
            value={inviteIdentifier}
            onChange={(e) => setInviteIdentifier(e.target.value)}
            icon={Mail}
            required
          />

          <Select
            label="Workspace Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={[
              { label: 'Member (Can create & manage tasks)', value: 'MEMBER' },
              { label: 'Admin (Can manage projects & team members)', value: 'ADMIN' },
              { label: 'Viewer (Read-only observation access)', value: 'VIEWER' },
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" onClick={() => setInviteModalOpen(false)} disabled={inviteLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={inviteLoading}>
              Add to Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirmation */}
      <ConfirmationModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title={`Remove ${memberToRemove?.user.username}?`}
        message={`Are you sure you want to remove ${memberToRemove?.user.first_name || memberToRemove?.user.username} from this workspace? They will lose access to its projects and tasks.`}
        confirmText="Remove Member"
        loading={removeLoading}
      />
    </div>
  );
};

export default TeamPage;
