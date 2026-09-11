import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TaskCreateModal from '../modals/TaskCreateModal';
import WorkspaceCreateModal from '../modals/WorkspaceCreateModal';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenNewWorkspace={() => setWorkspaceModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenNewTask={() => setTaskModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet context={{ openNewTaskModal: () => setTaskModalOpen(true) }} />
        </main>
      </div>

      {/* Global Modals */}
      <TaskCreateModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onTaskCreated={() => {
          // Trigger a custom event so active pages refresh seamlessly
          window.dispatchEvent(new CustomEvent('taskflow:task-created'));
        }}
      />

      <WorkspaceCreateModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
