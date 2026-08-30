"use client";

import { useState } from "react";

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  deadline: string;
  type: string;
}

export default function TrackerPage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Passport Copy Upload', status: 'done', deadline: '2026-06-01', type: 'document' },
    { id: '2', title: 'Letter of Motivation', status: 'in-progress', deadline: '2026-06-15', type: 'document' },
    { id: '3', title: 'Language Certificate (IELTS/TOEFL)', status: 'todo', deadline: '2026-07-01', type: 'document' },
    { id: '4', title: 'University Application Submission', status: 'todo', deadline: '2026-07-15', type: 'action' },
    { id: '5', title: 'Blocked Account Setup', status: 'todo', deadline: '2026-08-01', type: 'finance' },
  ]);

  const updateStatus = (id: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div>
            <h1 className="flex min-w-0 items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              <span className="material-symbols-outlined text-primary text-4xl">task</span>
              Application Tracker
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
              Keep your documents and deadlines organized. Move tasks through the pipeline to track your journey to studying abroad.
            </p>
          </div>
          <div className="flex w-full flex-col items-start md:w-auto md:items-end">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Overall Progress</span>
            <div className="h-3 w-full max-w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(tasks.filter(t => t.status === 'done').length / tasks.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-primary mt-1">
              {Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}% Completed
            </span>
          </div>
        </div>

        {/* KanBan Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* To Do Column */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-100/50 p-4 dark:border-slate-700 dark:bg-slate-800/50 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">To Do</h2>
              <span className="ml-auto bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === 'todo').length}
              </span>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.status === 'todo').map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{task.type}</span>
                    <button onClick={() => updateStatus(task.id, 'in-progress')} className="text-slate-400 hover:text-blue-500 transition-colors">
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 line-clamp-2">{task.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900 w-fit px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="min-w-0 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-900/10 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">In Progress</h2>
              <span className="ml-auto bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === 'in-progress').length}
              </span>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.status === 'in-progress').map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 hover:border-primary transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{task.type}</span>
                    <button onClick={() => updateStatus(task.id, 'done')} className="text-slate-400 hover:text-emerald-500 transition-colors">
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                    </button>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 line-clamp-2">{task.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900 w-fit px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-[16px] text-blue-500 animate-pulse">hourglass_top</span>
                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/10 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">Completed</h2>
              <span className="ml-auto bg-emerald-200 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === 'done').length}
              </span>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.status === 'done').map(task => (
                <div key={task.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{task.type}</span>
                    <span className="material-symbols-outlined text-xl text-emerald-500">task_alt</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4 line-clamp-2 line-through decoration-emerald-500/30">{task.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="material-symbols-outlined text-[16px]">done_all</span>
                    Completed
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
