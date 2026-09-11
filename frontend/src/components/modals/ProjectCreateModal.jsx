import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import projectService from '../../services/projectService';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const ProjectCreateModal = ({ isOpen, onClose, onProjectCreated }) => {
  const { currentWorkspace } = useWorkspace();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    try {
      setLoading(true);
      const newProj = await projectService.createProject({
        workspace: currentWorkspace.id,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        status,
        target_date: targetDate || null,
      });

      success(`Project '[${newProj.key}] ${newProj.name}' created!`);
      setName('');
      setKey('');
      setDescription('');
      setTargetDate('');
      onProjectCreated(newProj);
      onClose();
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (val) => {
    setName(val);
    if (!key) {
      // Suggest 3-letter uppercase prefix from name
      const prefix = val.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
      setKey(prefix);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" subtitle="Projects group related tasks, milestones, and sprint boards.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Project Name"
          placeholder="e.g. Mobile Application v2 or Payment Gateway"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Project Key (Prefix)"
            placeholder="e.g. MOB or PAY"
            helperText="Used to generate task IDs (e.g. MOB-1, MOB-2)"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            maxLength={8}
            required
          />

          <Select
            label="Initial Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: 'Active (In Sprint)', value: 'ACTIVE' },
              { label: 'Planning', value: 'PLANNING' },
              { label: 'On Hold', value: 'ON_HOLD' },
              { label: 'Completed', value: 'COMPLETED' },
            ]}
          />
        </div>

        <Input
          type="date"
          label="Target Completion Date (Optional)"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
          <textarea
            rows={3}
            placeholder="Brief scope, architecture notes, or roadmap..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectCreateModal;
