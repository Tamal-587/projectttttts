import React from 'react';
import { Menu, Plus, Search } from 'lucide-react';
import Button from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';

export const Navbar = ({ onOpenSidebar, onOpenNewTask }) => {
  const { currentWorkspace, isViewer } = useWorkspace();

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200 hidden sm:inline">
            {currentWorkspace?.name || 'TaskFlow'}
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-xs text-indigo-400 font-medium bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-md">
            Sprint Board
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Create Task CTA */}
        {!isViewer && (
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={onOpenNewTask}
          >
            <span className="hidden xs:inline">New Task</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
