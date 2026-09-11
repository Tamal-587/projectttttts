import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

export const KanbanColumn = ({
  status,
  title,
  tasks = [],
  colorClass = 'bg-slate-400',
  onTaskClick,
  onStatusChange,
  onAddTask,
  onDropTask,
  draggedTask,
  setDraggedTask,
  isViewer,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set to false if leaving this column container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedTask && draggedTask.status !== status) {
      onDropTask(draggedTask.id, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-w-[300px] max-w-[340px] w-full rounded-2xl bg-slate-900/60 border transition-all duration-200 p-3 shrink-0 ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/20'
          : 'border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {title}
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/90 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>

        {!isViewer && (
          <button
            onClick={() => onAddTask(status)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={`Add task to ${title}`}
            aria-label={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[140px] pr-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onStatusChange={onStatusChange}
            isDragging={draggedTask?.id === task.id}
            onDragStart={(e, t) => setDraggedTask(t)}
            onDragEnd={() => setDraggedTask(null)}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-slate-800/80 rounded-xl text-center">
            <span className="text-xs text-slate-500 font-medium">No tasks in this column</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
