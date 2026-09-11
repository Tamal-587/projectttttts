import React from 'react';
import { Calendar, MessageSquare, Clock, ArrowRight, User } from 'lucide-react';
import Badge from '../common/Badge';

export const TaskCard = ({
  task,
  onClick,
  onStatusChange,
  isDragging,
  onDragStart,
  onDragEnd,
}) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE';

  const statuses = [
    { value: 'BACKLOG', label: 'Backlog' },
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'DONE', label: 'Done' },
  ];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      className={`group relative p-4 rounded-xl border bg-slate-900/90 hover:bg-slate-850 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl ${
        isDragging ? 'opacity-40 scale-95 border-indigo-500/80 ring-2 ring-indigo-500/30' : 'border-slate-800/80'
      }`}
    >
      {/* Top Header: Identifier and Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded">
          {task.identifier}
        </span>
        <Badge variant={task.priority} size="xs">
          {task.priority}
        </Badge>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug mb-3">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer Info: Due Date, Assignee, Comments, Quick Move */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          {task.due_date && (
            <div
              className={`flex items-center gap-1 font-medium ${
                isOverdue ? 'text-rose-400' : 'text-slate-400'
              }`}
              title={isOverdue ? 'Overdue deadline' : 'Due date'}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[11px]">{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
          )}

          {task.comments_count > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[11px]">{task.comments_count}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Quick status mover dropdown */}
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-[10px] bg-slate-800/90 border border-slate-700/60 rounded px-1.5 py-0.5 text-slate-300 hover:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            title="Move to another status column"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Assignee Avatar */}
          {task.assignee ? (
            task.assignee.profile?.avatar_url ? (
              <img
                src={task.assignee.profile.avatar_url}
                alt={task.assignee.username}
                title={`Assigned to ${task.assignee.first_name || task.assignee.username}`}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/50"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-[10px]"
                title={`Assigned to ${task.assignee.first_name || task.assignee.username}`}
              >
                {task.assignee.username.charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <div
              className="w-6 h-6 rounded-full bg-slate-800 border border-dashed border-slate-700 text-slate-500 flex items-center justify-center"
              title="Unassigned"
            >
              <User className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
