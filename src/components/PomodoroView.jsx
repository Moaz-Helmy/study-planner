import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Coffee,
  Brain,
  Clock,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import {
  getLocalDateString,
  formatMinutes,
  getCourseColor,
  formatNiceDate
} from '../data/initialData';

export default function PomodoroView({
  data,
  timerState,
  onStartPauseTimer,
  onResetTimer,
  onSwitchMode,
  onChangeTimerTarget,
  onCompleteSessionNow,
  onLogManualSession
}) {
  const [manualForm, setManualForm] = useState({
    courseId: data.courses[0]?.id || '',
    topicId: '',
    durationMinutes: 45,
    date: getLocalDateString(),
    notes: ''
  });

  const {
    mode,
    secondsLeft,
    totalSeconds,
    isRunning,
    courseId,
    topicId,
    taskId,
    sessionNotes
  } = timerState;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPct =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100))
      : 0;

  const selectedCourse = data.courses.find((c) => c.id === courseId);
  const manualCourse = data.courses.find((c) => c.id === manualForm.courseId);

  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const elapsedMinutes = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60));

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.durationMinutes || Number(manualForm.durationMinutes) <= 0) return;
    onLogManualSession({
      courseId: manualForm.courseId,
      topicId: manualForm.topicId,
      durationMinutes: Number(manualForm.durationMinutes),
      date: manualForm.date || getLocalDateString(),
      notes: manualForm.notes.trim() || 'Logged study session'
    });
    setManualForm({ ...manualForm, notes: '' });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          Pomodoro Focus Studio & Session Logger
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Link your timer to a course & topic. Completed focus sessions automatically update your syllabus hours and streak.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Interactive Timer Ring */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col items-center justify-between">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            {[
              { id: 'focus', label: `Focus (${data.settings?.pomodoroFocusMinutes || 25}m)`, icon: Brain },
              { id: 'shortBreak', label: `Short Break (${data.settings?.pomodoroShortBreakMinutes || 5}m)`, icon: Coffee },
              { id: 'longBreak', label: `Long Break (${data.settings?.pomodoroLongBreakMinutes || 15}m)`, icon: Sparkles }
            ].map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSwitchMode(m.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Circular Progress SVG */}
          <div className="relative my-6 flex items-center justify-center">
            <svg className="h-64 w-64 -rotate-90 transform">
              <circle
                cx="128"
                cy="128"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="128"
                cy="128"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className={`transition-all duration-500 ${
                  mode === 'focus' ? 'text-indigo-500' : 'text-emerald-500'
                }`}
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-5xl font-extrabold tracking-tight text-white font-mono">
                {formattedTime}
              </span>
              <span className="mt-1.5 text-xs font-medium uppercase tracking-widest text-indigo-400">
                {mode === 'focus'
                  ? isRunning
                    ? 'Deep Focus Active'
                    : 'Ready to Focus'
                  : 'Break & Recharge'}
              </span>
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartPauseTimer}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  Pause Timer
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  {secondsLeft < totalSeconds ? 'Resume Timer' : 'Start Timer'}
                </>
              )}
            </button>

            <button
              onClick={onResetTimer}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-200 transition"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            {mode === 'focus' && (
              <button
                onClick={() => onCompleteSessionNow(elapsedMinutes)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-3 text-xs font-semibold text-emerald-300 transition"
                title="Finish and log this session immediately"
              >
                <CheckCircle className="h-4 w-4" />
                Log Session ({secondsLeft < totalSeconds ? `${elapsedMinutes}m` : `${Math.round(totalSeconds / 60)}m`})
              </button>
            )}
          </div>

          {/* Linked Course / Topic / Task Selection */}
          <div className="mt-6 w-full border-t border-slate-800 pt-5 space-y-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Currently Focusing On
            </span>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Course / Subject</label>
                <select
                  value={courseId}
                  onChange={(e) =>
                    onChangeTimerTarget({
                      courseId: e.target.value,
                      topicId: '',
                      taskId
                    })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">General Study</option>
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Topic / Module</label>
                <select
                  value={topicId}
                  onChange={(e) =>
                    onChangeTimerTarget({
                      courseId,
                      topicId: e.target.value,
                      taskId
                    })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">All Topics in Course</option>
                  {(selectedCourse?.topics || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Session Notes / Reflection</label>
              <input
                type="text"
                placeholder="What concepts or problems are you working on in this block?"
                value={sessionNotes}
                onChange={(e) =>
                  onChangeTimerTarget({
                    courseId,
                    topicId,
                    taskId,
                    sessionNotes: e.target.value
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Manual Session Logger + Recent Session History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Manual Study Session Logger */}
          <form
            onSubmit={handleManualSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-emerald-400" />
              Log Offline / Manual Study Session
            </h2>
            <p className="text-xs text-slate-400">
              Studied away from your computer or in a lecture? Log the time here to keep your analytics accurate.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Course</label>
                <select
                  value={manualForm.courseId}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, courseId: e.target.value, topicId: '' })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Topic (optional)</label>
                <select
                  value={manualForm.topicId}
                  onChange={(e) => setManualForm({ ...manualForm, topicId: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">General Course Study</option>
                  {(manualCourse?.topics || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Minutes Studied</label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  value={manualForm.durationMinutes}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, durationMinutes: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Summary note (e.g. Solved past exam paper)"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-semibold text-white shadow transition"
            >
              + Record Study Session
            </button>
          </form>

          {/* Recent Study Sessions Feed */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-bold text-white mb-3">Recent Focus Sessions</h3>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {(data.sessions || []).slice(0, 8).map((sess) => {
                const course = data.courses.find((c) => c.id === sess.courseId);
                const col = getCourseColor(course?.color);
                return (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-slate-950/60 p-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {course && (
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${col.bg} ${col.text}`}>
                            {course.code}
                          </span>
                        )}
                        <span className="font-medium text-slate-200 truncate">
                          {sess.notes || 'Focused Study Session'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatNiceDate(sess.date)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-indigo-500/15 px-2.5 py-1 font-bold text-indigo-300">
                      +{formatMinutes(sess.durationMinutes)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
