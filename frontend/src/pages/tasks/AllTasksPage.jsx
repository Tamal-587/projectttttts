import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Filter, Plus, Calendar, Trash2, ArrowUpDown,
  CheckCircle2, Clock, User
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { TableRowSkeleton } from '../../components/common/SkeletonLoader';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer';
import TaskCreateModal from '../../components/modals/TaskCreateModal';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const AllTasksPage = () => {
  const { currentWorkspace, isViewer } = useWorkspace();
  const { success, error } = useToast();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const [tasksData, projsData] = await Promise.all([
        taskService.getTasks({ workspace: currentWorkspace.slug }),
        projectService.getProjects({ workspace: currentWorkspace.slug }),
      ]);
      setTasks(tasksData);
      setProjects(projsData);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      setDeleteLoading(true);
      await taskService.deleteTask(taskToDelete.id);
      success(`Task ${taskToDelete.identifier} deleted.`);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (err) {
      error('Failed to delete task.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.identifier.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (projectFilter && t.project !== parseInt(projectFilter, 10)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, projectFilter, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">All Tasks</h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect all sprint issues across projects
          </p>
        </div>

        {!isViewer && (
          <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
            New Task
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title or task ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Project Filter */}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.key}] {p.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-6">
            <TableRowSkeleton count={6} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No tasks match your criteria"
              description="Try adjusting your search terms or status filters, or create a new sprint task."
              actionLabel={!isViewer ? 'Create Task' : undefined}
              onAction={() => setCreateModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase text-[11px] font-semibold text-slate-400 border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Key</th>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Assignee</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => {
                      setSelectedTask(t);
                      setDrawerOpen(true);
                    }}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-indigo-400">
                      {t.identifier}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors max-w-xs sm:max-w-md truncate">
                      {t.title}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={t.status} size="xs">
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={t.priority} size="xs">
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {t.assignee ? (
                        <div className="flex items-center gap-2">
                          {t.assignee.profile?.avatar_url ? (
                            <img
                              src={t.assignee.profile.avatar_url}
                              alt={t.assignee.username}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-[9px]">
                              {t.assignee.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate">
                            {t.assignee.first_name || t.assignee.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {t.due_date ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(t.due_date).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {!isViewer && (
                        <button
                          onClick={() => setTaskToDelete(t)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete task"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskUpdated={(upd) => {
          setTasks((prev) => prev.map((t) => (t.id === upd.id ? upd : t)));
        }}
        onTaskDeleted={(delId) => {
          setTasks((prev) => prev.filter((t) => t.id !== delId));
        }}
      />

      {/* Create Modal */}
      <TaskCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTaskCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDelete}
        title={`Delete ${taskToDelete?.identifier}?`}
        message="Are you sure you want to delete this task? This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
};

export default AllTasksPage;
