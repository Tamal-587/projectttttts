import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Rss,
  LayoutDashboard,
  KanbanSquare,
  CheckSquare,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Layers,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

export const Sidebar = ({ isOpen, onClose, onOpenNewWorkspace }) => {
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: 'Community Feed', path: '/feed', icon: Rss },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Kanban Board', path: '/board', icon: KanbanSquare },
    { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Team & Access', path: '/team', icon: Users },
    { label: 'My Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                DevPulse
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  Pro
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="relative px-3 py-3 border-b border-slate-800/60">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-indigo-900/60 text-indigo-400 border border-indigo-700/40 flex items-center justify-center font-bold text-xs shrink-0">
                {currentWorkspace?.name ? currentWorkspace.name.charAt(0).toUpperCase() : 'W'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {currentWorkspace?.my_role ? `${currentWorkspace.my_role.toLowerCase()} role` : 'Workspace'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 flex flex-col gap-1">
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    selectWorkspace(ws.slug);
                    setWorkspaceMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    ws.slug === currentWorkspace?.slug
                      ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}

              <div className="pt-1 mt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    onOpenNewWorkspace();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
            <Link
              to={`/profile/${user?.username}`}
              onClick={onClose}
              className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity"
            >
              {user?.profile?.avatar_url ? (
                <img
                  src={user.profile.avatar_url}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  @{user?.username}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
