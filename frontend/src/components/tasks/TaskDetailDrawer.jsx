import React, { useState, useEffect } from 'react';
import {
  X, Trash2, Calendar, User, Clock, MessageSquare, Send, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import taskService from '../../services/taskService';
import workspaceService from '../../services/workspaceService';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const TaskDetailDrawer = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { user } = useAuth();
  const { currentWorkspace, isViewer } = useWorkspace();
  const { success, error } = useToast();

  const [members, setMembers] = useState([]);
  const [currentTask, setCurrentTask] = useState(task);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync state when task prop changes
  useEffect(() => {
    if (task && isOpen) {
      setCurrentTask(task);
      loadComments(task.id);
    }
  }, [task, isOpen]);

  // Load workspace members for assignee dropdown
  useEffect(() => {
    if (isOpen && currentWorkspace) {
      workspaceService
        .getMembers(currentWorkspace.slug)
        .then(setMembers)
        .catch(console.error);
    }
  }, [isOpen, currentWorkspace]);

  const loadComments = async (taskId) => {
    try {
      const list = await taskService.getComments(taskId);
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleFieldChange = async (fieldName, value) => {
    if (!currentTask || isViewer) return;

    try {
      setSavingField(true);
      const updatePayload = { [fieldName]: value };
      const updated = await taskService.updateTask(currentTask.id, updatePayload);
      setCurrentTask(updated);
      if (onTaskUpdated) onTaskUpdated(updated);
      success(`Updated ${fieldName.replace('_', ' ')}`);
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to update task.');
    } finally {
      setSavingField(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentTask || isViewer) return;

    try {
      setCommentLoading(true);
      const comment = await taskService.addComment(currentTask.id, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      success('Comment posted');
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await taskService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      success('Comment removed');
    } catch (err) {
      error('Failed to delete comment.');
    }
  };

  const handleDeleteTask = async () => {
    if (!currentTask) return;
    try {
      setDeleteLoading(true);
      await taskService.deleteTask(currentTask.id);
      success(`Task ${currentTask.identifier} deleted.`);
      setShowDeleteConfirm(false);
      onClose();
      if (onTaskDeleted) onTaskDeleted(currentTask.id);
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to delete task.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen || !currentTask) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
              {currentTask.identifier}
            </span>
            <Badge variant={currentTask.status} size="sm">
              {currentTask.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!isViewer && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                title="Delete Task"
                aria-label="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Close task drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title input / view */}
          <div>
            <input
              type="text"
              disabled={isViewer}
              defaultValue={currentTask.title}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== currentTask.title) {
                  handleFieldChange('title', e.target.value.trim());
                }
              }}
              className="w-full text-xl font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none transition-colors pb-1"
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
            {/* Status */}
            <div>
              <label className="text-slate-400 font-medium block mb-1.5">Status</label>
              <select
                disabled={isViewer}
                value={currentTask.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-slate-400 font-medium block mb-1.5">Priority</label>
              <select
                disabled={isViewer}
                value={currentTask.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-slate-400 font-medium block mb-1.5">Assignee</label>
              <select
                disabled={isViewer}
                value={currentTask.assignee?.id || ''}
                onChange={(e) =>
                  handleFieldChange('assignee_id', e.target.value ? parseInt(e.target.value, 10) : null)
                }
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : m.user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-slate-400 font-medium block mb-1.5">Due Date</label>
              <input
                type="date"
                disabled={isViewer}
                value={currentTask.due_date || ''}
                onChange={(e) => handleFieldChange('due_date', e.target.value || null)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Reporter */}
            <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
              <span>Reported by: <strong className="text-slate-300 font-semibold">{currentTask.reporter?.first_name || currentTask.reporter?.username}</strong></span>
              <span>Created: {new Date(currentTask.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description</h4>
            <textarea
              rows={4}
              disabled={isViewer}
              defaultValue={currentTask.description || ''}
              placeholder={isViewer ? 'No description provided.' : 'Add a detailed description or acceptance criteria...'}
              onBlur={(e) => {
                if (e.target.value !== (currentTask.description || '')) {
                  handleFieldChange('description', e.target.value.trim());
                }
              }}
              className="w-full rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Discussion ({comments.length})
              </h4>
            </div>

            {/* Comment Form */}
            {!isViewer && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  icon={Send}
                  loading={commentLoading}
                  disabled={!newComment.trim()}
                >
                  Send
                </Button>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {c.author.profile?.avatar_url ? (
                          <img
                            src={c.author.profile.avatar_url}
                            alt={c.author.username}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-[10px]">
                            {c.author.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-slate-200">
                          {c.author.first_name ? `${c.author.first_name} ${c.author.last_name || ''}` : c.author.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {(c.author.id === user?.id || currentWorkspace?.my_role === 'OWNER') && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-slate-500 hover:text-rose-400 p-0.5"
                            title="Delete comment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 whitespace-pre-wrap pl-7 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title={`Delete ${currentTask.identifier}?`}
        message="Are you sure you want to delete this task? All comments and associated history will be permanently deleted."
        confirmText="Delete Task"
        loading={deleteLoading}
      />
    </>
  );
};

export default TaskDetailDrawer;
