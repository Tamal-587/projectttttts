import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const WorkspaceCreateModal = ({ isOpen, onClose }) => {
  const { createWorkspace } = useWorkspace();
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await createWorkspace({ name, description });
      success(`Workspace '${name}' created successfully!`);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      error(err.response?.data?.error?.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Workspace" subtitle="Workspaces organize teams, projects, and task boards.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Workspace Name"
          placeholder="e.g. Acme Engineering or CodeAlpha Team"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
          <textarea
            rows={3}
            placeholder="Brief overview of this workspace..."
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
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkspaceCreateModal;
