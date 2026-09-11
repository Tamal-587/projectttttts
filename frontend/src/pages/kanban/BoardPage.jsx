import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Filter, Plus, Layers, CheckCircle2,
  Calendar, RefreshCw
} from 'lucide-react';
import KanbanColumn from '../../components/kanban/KanbanColumn';
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer';
import TaskCreateModal from '../../components/modals/TaskCreateModal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BoardPage = () => {
  const { currentWorkspace, isViewer } = useWorkspace();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState('TODO');

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);

  const loadProjects = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const projs = await projectService.getProjects({ workspace: currentWorkspace.slug });
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [currentWorkspace, selectedProjectId]);

  const loadTasks = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = {
        workspace: currentWorkspace.slug,
      };
      if (selectedProjectId) {
        params.project = selectedProjectId;
      }
      const data = await taskService.getTasks(params);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle Quick Status / Drag and Drop Status Update
  const handleStatusChange = async (taskId, newStatus) => {
    if (isViewer) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await taskService.quickStatusUpdate(taskId, newStatus);
      success(`Task moved to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      error('Failed to update task status.');
      // Revert on error
      loadTasks();
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleOpenAddTask = (columnStatus) => {
    setCreateModalStatus(columnStatus);
    setCreateModalOpen(true);
  };

  // Filter tasks client-side for ultra-snappy responsiveness
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesKey = task.identifier.toLowerCase().includes(q);
        if (!matchesTitle && !matchesKey) return false;
      }

      if (priorityFilter && task.priority !== priorityFilter) {
        return false;
      }

      if (assigneeFilter === 'me' && task.assignee?.id !== user?.id) {
        return false;
      }
      if (assigneeFilter === 'unassigned' && task.assignee !== null) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter, user]);

  const columns = [
    { status: 'BACKLOG', title: 'Backlog', color: 'bg-slate-500' },
    { status: 'TODO', title: 'To Do', color: 'bg-blue-500' },
    { status: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-500' },
    { status: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-500' },
    { status: 'DONE', title: 'Done', color: 'bg-emerald-500' },
  ];

  if (!currentWorkspace) {
    return (
      <EmptyState
        title="No Workspace Selected"
        description="Select or create a workspace to view your agile boards."
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-200">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
            />
          </div>

          {/* Priority filter pills */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setPriorityFilter('')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                priorityFilter === '' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriorityFilter('URGENT')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                priorityFilter === 'URGENT' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Urgent
            </button>
            <button
              onClick={() => setPriorityFilter('HIGH')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                priorityFilter === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              High
            </button>
          </div>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>

        {/* Create Task Button & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadTasks}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh board"
            aria-label="Refresh board"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isViewer && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => handleOpenAddTask('TODO')}
            >
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Columns Scrollable Canvas */}
      <div className="flex-1 flex gap-4 overflow-x-auto pt-4 pb-2 items-start">
        {loading ? (
          <div className="flex gap-4 w-full">
            {columns.map((col) => (
              <div
                key={col.status}
                className="w-80 h-96 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse p-4"
              />
            ))}
          </div>
        ) : (
          columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);
            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                title={col.title}
                colorClass={col.color}
                tasks={colTasks}
                onTaskClick={handleTaskClick}
                onStatusChange={handleStatusChange}
                onAddTask={handleOpenAddTask}
                onDropTask={handleStatusChange}
                draggedTask={draggedTask}
                setDraggedTask={setDraggedTask}
                isViewer={isViewer}
              />
            );
          })
        )}
      </div>

      {/* Task Detail Slide-over Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultStatus={createModalStatus}
        defaultProjectId={selectedProjectId}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [newTask, ...prev]);
        }}
      />
    </div>
  );
};

export default BoardPage;
