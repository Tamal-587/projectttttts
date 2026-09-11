import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import workspaceService from '../../services/workspaceService';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const TaskCreateModal = ({ isOpen, onClose, onTaskCreated, defaultProjectId, defaultStatus }) => {
  const { currentWorkspace } = useWorkspace();
  const { success, error } = useToast();

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(defaultStatus || 'TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      // Load workspace projects
      projectService
        .getProjects({ workspace: currentWorkspace.slug })
        .then((projs) => {
          setProjects(projs);
          if (!projectId && projs.length > 0) {
            setProjectId(defaultProjectId || projs[0].id);
          }
        })
        .catch(console.error);

      // Load workspace members
      workspaceService
        .getMembers(currentWorkspace.slug)
        .then(setMembers)
        .catch(console.error);
    }
  }, [isOpen, currentWorkspace, defaultProjectId]);

  useEffect(() => {
    if (defaultStatus) setStatus(defaultStatus);
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultStatus, defaultProjectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    try {
      setLoading(true);
      const payload = {
        project: parseInt(projectId, 10),
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
      };

      const created = await taskService.createTask(payload);
      success(`Task '${created.identifier}' created successfully!`);
      setTitle('');
      setDescription('');
      setDueDate('');
      setEstimatedHours('');
      setAssigneeId('');
      if (onTaskCreated) onTaskCreated(created);
      onClose();
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" subtitle="Add an item to the sprint backlog or active board.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
        >
          {projects.length === 0 ? (
            <option value="">No projects available</option>
          ) : (
            projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.key}] {p.name}
              </option>
            ))
          )}
        </Select>

        <Input
          label="Task Title"
          placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: 'Backlog', value: 'BACKLOG' },
              { label: 'To Do', value: 'TODO' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'In Review', value: 'IN_REVIEW' },
              { label: 'Done', value: 'DONE' },
            ]}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { label: 'Low Priority', value: 'LOW' },
              { label: 'Medium Priority', value: 'MEDIUM' },
              { label: 'High Priority', value: 'HIGH' },
              { label: 'Urgent', value: 'URGENT' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : m.user.username} ({m.role})
              </option>
            ))}
          </Select>

          <Input
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <Input
          type="number"
          step="0.5"
          min="0"
          label="Estimated Hours (Optional)"
          placeholder="e.g. 4.5"
          value={estimatedHours}
          onChange={(e) => setEstimatedHours(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
          <textarea
            rows={3}
            placeholder="Acceptance criteria, notes, or implementation details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={projects.length === 0}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskCreateModal;
