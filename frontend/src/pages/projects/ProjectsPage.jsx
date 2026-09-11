import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Calendar, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import ProjectCreateModal from '../../components/modals/ProjectCreateModal';
import projectService from '../../services/projectService';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const ProjectsPage = () => {
  const { currentWorkspace, isOwnerOrAdmin, isViewer } = useWorkspace();
  const { success, error } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setLoading(true);
      const data = await projectService.getProjects({ workspace: currentWorkspace.slug });
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      setDeleteLoading(true);
      await projectService.deleteProject(projectToDelete.id);
      success(`Project '${projectToDelete.name}' deleted.`);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err) {
      error('Failed to delete project.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Projects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage repository initiatives, sprint goals, and project roadmaps
          </p>
        </div>

        {!isViewer && (
          <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
            New Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first engineering project to start tracking issues and sprints."
          actionLabel={!isViewer ? 'Create Project' : undefined}
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const metrics = p.task_metrics || {};
            return (
              <div
                key={p.id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-md">
                      {p.key}
                    </span>

                    <div className="flex items-center gap-2">
                      <Badge variant={p.status === 'ACTIVE' ? 'primary' : 'default'} size="xs">
                        {p.status}
                      </Badge>
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => setProjectToDelete(p)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                          title="Delete Project"
                          aria-label="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {p.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  {p.target_date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Target: {new Date(p.target_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Progress indicator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{metrics.done || 0} / {metrics.total || 0} tasks</span>
                      <span className="font-semibold text-slate-200">{metrics.completion_rate || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${metrics.completion_rate || 0}%` }}
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link to="/board">
                      <Button variant="outline" size="sm" className="w-full text-xs" icon={ArrowRight} iconPosition="right">
                        View Board
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ProjectCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onProjectCreated={(newProj) => setProjects((prev) => [newProj, ...prev])}
      />

      <ConfirmationModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title={`Delete Project '${projectToDelete?.name}'?`}
        message="Deleting this project will permanently delete all associated tasks, board columns, and comments. Are you sure you want to proceed?"
        loading={deleteLoading}
      />
    </div>
  );
};

export default ProjectsPage;
