import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertTriangle, ListTodo, FolderKanban,
  Users, ArrowRight, Plus, Activity, Zap, CheckSquare
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import workspaceService from '../../services/workspaceService';
import projectService from '../../services/projectService';
import { useWorkspace } from '../../context/WorkspaceContext';

export const DashboardPage = () => {
  const { currentWorkspace, loading: wsLoading, isViewer } = useWorkspace();
  const outletContext = useOutletContext();
  const openNewTaskModal = outletContext?.openNewTaskModal;

  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [analyticsData, activityData, projectsData] = await Promise.all([
        workspaceService.getAnalytics(currentWorkspace.slug),
        workspaceService.getActivity(currentWorkspace.slug),
        projectService.getProjects({ workspace: currentWorkspace.slug }),
      ]);

      setAnalytics(analyticsData);
      setActivities(activityData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadDashboardData();

    // Listen for custom task creation events to auto-refresh metrics
    const handleTaskCreated = () => loadDashboardData();
    window.addEventListener('taskflow:task-created', handleTaskCreated);
    return () => window.removeEventListener('taskflow:task-created', handleTaskCreated);
  }, [loadDashboardData]);

  if (wsLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 w-full bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
        <CardSkeleton count={4} />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        title="No Workspace Selected"
        description="Please select or create a workspace to view your project metrics and active sprints."
      />
    );
  }

  const summary = analytics?.summary || {};
  const statusStats = analytics?.status_breakdown || {};
  const priorityStats = analytics?.priority_breakdown || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-0.5 rounded-full">
                Agile Workspace
              </span>
              <span className="text-xs text-slate-400">
                {summary.total_members || 1} team members
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentWorkspace.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              {currentWorkspace.description || 'Welcome to your sprint workspace. Track tasks, collaborate with team members, and monitor agile velocity.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/board">
              <Button variant="primary" icon={Zap}>
                Open Kanban Board
              </Button>
            </Link>
            {!isViewer && (
              <Button variant="outline" icon={Plus} onClick={openNewTaskModal}>
                Add Task
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tasks</p>
            <h3 className="text-3xl font-bold text-white mt-1">{summary.total_tasks ?? 0}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Across {summary.total_projects ?? 0} projects</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</p>
            <h3 className="text-3xl font-bold text-amber-300 mt-1">{summary.in_progress_tasks ?? 0}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Active sprint items</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</p>
            <h3 className="text-3xl font-bold text-emerald-300 mt-1">{summary.completed_tasks ?? 0}</h3>
            <p className="text-[11px] text-emerald-400/80 mt-1 font-medium">{summary.completion_rate ?? 0}% velocity</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overdue</p>
            <h3 className={`text-3xl font-bold mt-1 ${summary.overdue_tasks > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {summary.overdue_tasks ?? 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Needs attention</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/40">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Progress & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint Progress & Status Distribution */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              Sprint Progress & Status
            </h3>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/50">
              {summary.completion_rate ?? 0}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${summary.completion_rate ?? 0}%` }}
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Backlog</p>
              <p className="text-lg font-bold text-slate-200 mt-0.5">{statusStats.backlog ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-semibold text-blue-400">To Do</p>
              <p className="text-lg font-bold text-blue-200 mt-0.5">{statusStats.todo ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-semibold text-amber-400">In Progress</p>
              <p className="text-lg font-bold text-amber-200 mt-0.5">{statusStats.in_progress ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-semibold text-purple-400">In Review</p>
              <p className="text-lg font-bold text-purple-200 mt-0.5">{statusStats.in_review ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
              <p className="text-[10px] uppercase font-semibold text-emerald-400">Done</p>
              <p className="text-lg font-bold text-emerald-200 mt-0.5">{statusStats.done ?? 0}</p>
            </div>
          </div>

          {/* Priority Breakdown Pills */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Task Priority Distribution
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-rose-300 font-medium">Urgent: {priorityStats.urgent ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-300 font-medium">High: {priorityStats.high ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-blue-300 font-medium">Medium: {priorityStats.medium ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-300 font-medium">Low: {priorityStats.low ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Audit Stream */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Activity Audit Log
            </h3>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-80 pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No recent actions recorded.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors">
                  {act.user?.profile?.avatar_url ? (
                    <img
                      src={act.user.profile.avatar_url}
                      alt={act.user.username}
                      className="w-6 h-6 rounded-full object-cover mt-0.5 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-800 text-white flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">
                      {act.user?.username ? act.user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 leading-snug break-words">
                      <strong className="text-white font-semibold">{act.user?.first_name || act.user?.username}</strong>{' '}
                      {act.summary.replace(/^Created task [^:]+: /, 'created task ')}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {new Date(act.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            Active Projects in Workspace
          </h3>
          <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            View All Projects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const metrics = p.task_metrics || {};
            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
                      {p.key}
                    </span>
                    <Badge variant={p.status === 'ACTIVE' ? 'primary' : 'default'} size="xs">
                      {p.status}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">{p.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{metrics.done || 0} of {metrics.total || 0} tasks done</span>
                    <span className="font-semibold text-slate-200">{metrics.completion_rate || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${metrics.completion_rate || 0}%` }}
                      className="bg-indigo-500 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
