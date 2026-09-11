import React, { useState, useEffect } from 'react';
import { User, Lock, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const ProfileSettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    department: '',
    avatar_url: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        job_title: user.profile?.job_title || '',
        department: user.profile?.department || '',
        avatar_url: user.profile?.avatar_url || '',
        bio: user.profile?.bio || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      await updateProfile(profileForm);
      success('Profile updated successfully!');
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      error('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      success('Password changed successfully!');
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.old_password?.[0] || 'Failed to change password.';
      error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Account & Profile Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize your developer profile, company role, and security credentials
        </p>
      </div>

      {/* Profile Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Personal Profile</h2>
            <p className="text-xs text-slate-400">Shown to other members across your workspaces</p>
          </div>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          {profileForm.avatar_url ? (
            <img
              src={profileForm.avatar_url}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="flex-1 max-w-md">
            <Input
              label="Avatar Image URL"
              placeholder="https://images.unsplash.com/..."
              value={profileForm.avatar_url}
              onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
            />
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              placeholder="e.g. Senior Full Stack Engineer"
              value={profileForm.job_title}
              onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
            />
            <Input
              label="Department"
              placeholder="e.g. Core Engineering & Platform"
              value={profileForm.department}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-300">Bio</label>
            <textarea
              rows={3}
              placeholder="Tell your team about yourself..."
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" icon={Save} loading={profileLoading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Password Change Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Security & Password</h2>
            <p className="text-xs text-slate-400">Ensure your account uses a strong, secure passphrase</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <Input
            type="password"
            label="Current Password"
            value={passwordForm.old_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
            required
          />

          <Input
            type="password"
            label="New Password"
            placeholder="Min. 6 characters"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            required
          />

          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={passwordForm.new_password_confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })}
            required
          />

          <div className="pt-2">
            <Button type="submit" variant="secondary" icon={ShieldCheck} loading={passwordLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
