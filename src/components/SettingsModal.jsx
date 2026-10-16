import React, { useState } from 'react';
import {
  X,
  FolderOpen,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Database,
  CheckCircle2
} from 'lucide-react';

export default function SettingsModal({
  data,
  dbPath,
  onClose,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onRevealDbFolder,
  onResetSampleData,
  onClearAllData
}) {
  const [form, setForm] = useState({
    userName: data.settings?.userName || 'ZIZO',
    dailyGoalMinutes: data.settings?.dailyGoalMinutes || 120,
    pomodoroFocusMinutes: data.settings?.pomodoroFocusMinutes || 25,
    pomodoroShortBreakMinutes: data.settings?.pomodoroShortBreakMinutes || 5,
    pomodoroLongBreakMinutes: data.settings?.pomodoroLongBreakMinutes || 15,
    soundEnabled: data.settings?.soundEnabled ?? true
  });
  const [statusMsg, setStatusMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings({
      userName: form.userName.trim() || 'Scholar',
      dailyGoalMinutes: Math.max(15, Number(form.dailyGoalMinutes) || 120),
      pomodoroFocusMinutes: Math.max(5, Number(form.pomodoroFocusMinutes) || 25),
      pomodoroShortBreakMinutes: Math.max(1, Number(form.pomodoroShortBreakMinutes) || 5),
      pomodoroLongBreakMinutes: Math.max(5, Number(form.pomodoroLongBreakMinutes) || 15),
      soundEnabled: Boolean(form.soundEnabled)
    });
    setStatusMsg('Settings saved!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">
            Preferences & Local Database Storage
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Daily Study Goal (Minutes)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={form.dailyGoalMinutes}
                onChange={(e) => setForm({ ...form, dailyGoalMinutes: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Focus Duration (m)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={form.pomodoroFocusMinutes}
                onChange={(e) => setForm({ ...form, pomodoroFocusMinutes: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Short Break (m)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.pomodoroShortBreakMinutes}
                onChange={(e) =>
                  setForm({ ...form, pomodoroShortBreakMinutes: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Long Break (m)
              </label>
              <input
                type="number"
                min="5"
                max="90"
                value={form.pomodoroLongBreakMinutes}
                onChange={(e) =>
                  setForm({ ...form, pomodoroLongBreakMinutes: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-200">Completion Chime & Desktop Notification</p>
              <p className="text-[11px] text-slate-400">Play audio chime when a Pomodoro timer completes</p>
            </div>
            <input
              type="checkbox"
              checked={form.soundEnabled}
              onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })}
              className="h-4 w-4 accent-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {statusMsg ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {statusMsg}
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow"
            >
              Save Preferences
            </button>
          </div>
        </form>

        {/* Local Database Management Section */}
        <div className="mt-6 border-t border-slate-800 pt-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Database className="h-4 w-4 text-indigo-400" />
            Local Database & Backups
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
            <span className="text-slate-400 block mb-1">Automatic Local Storage Path:</span>
            <code className="text-[11px] text-indigo-300 break-all">
              {dbPath || 'Local Browser Storage + ./data/studyflow-db.json'}
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={onRevealDbFolder}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200"
            >
              <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
              Open Data Folder
            </button>

            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              Export JSON Backup
            </button>

            <button
              type="button"
              onClick={onImportBackup}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200"
            >
              <Upload className="h-3.5 w-3.5 text-amber-400" />
              Import Backup
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onResetSampleData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Starter Sample Data
            </button>

            <button
              type="button"
              onClick={onClearAllData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All Data (Start Blank)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
