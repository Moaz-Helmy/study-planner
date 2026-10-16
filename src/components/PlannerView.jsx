import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  getLocalDateString,
  addDays,
  formatNiceDate,
  formatMinutes,
  getCourseColor
} from '../data/initialData';

export default function PlannerView({
  data,
  onUpdateTasks,
  onToggleTask,
  onStartFocusOnTarget
}) {
  const today = getLocalDateString();
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'list'
  const [listFilter, setListFilter] = useState('TODAY'); // 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED' | 'ALL'
  const [weekOffset, setWeekOffset] = useState(0);

  const [form, setForm] = useState({
    title: '',
    courseId: data.courses[0]?.id || '',
    topicId: '',
    date: today,
    startTime: '18:00',
    endTime: '19:00',
    estimatedMinutes: 60,
    priority: 'High',
    notes: ''
  });

  const selectedCourse = data.courses.find((c) => c.id === form.courseId);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: form.title.trim(),
      courseId: form.courseId,
      topicId: form.topicId,
      date: form.date || today,
      startTime: form.startTime,
      endTime: form.endTime,
      estimatedMinutes: Number(form.estimatedMinutes) || 45,
      priority: form.priority,
      completed: false,
      notes: form.notes.trim()
    };

    onUpdateTasks([newTask, ...(data.tasks || [])]);
    setForm({
      ...form,
      title: '',
      notes: ''
    });
  };

  const handleDeleteTask = (id) => {
    onUpdateTasks((data.tasks || []).filter((t) => t.id !== id));
  };

  // Compute 7 days for Weekly Calendar Grid starting from current week's Monday (or rolling 7 days from weekOffset)
  const startOfGrid = addDays(today, weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfGrid, i));

  const filteredListTasks = (data.tasks || [])
    .filter((t) => {
      if (listFilter === 'TODAY') return t.date === today;
      if (listFilter === 'UPCOMING') return !t.completed && t.date > today;
      if (listFilter === 'OVERDUE') return !t.completed && t.date < today;
      if (listFilter === 'COMPLETED') return t.completed;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

  return (
    <div className="space-y-6 pb-8">
      {/* Header & View Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            Study Schedule & Daily/Weekly Planner
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Plan time-blocked study sessions across the week and link tasks directly to your syllabus topics.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setViewMode('weekly')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'weekly'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            7-Day Calendar Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            Task List View
          </button>
        </div>
      </div>

      {/* Quick Schedule Session / Task Form */}
      <form
        onSubmit={handleAddTask}
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            + Schedule New Study Session / Task
          </span>
          <span className="text-[11px] text-slate-400">
            Click any day header in the calendar below to pre-fill its date
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <input
            type="text"
            required
            placeholder="What will you study? (e.g. Solve 4 Graph Problems / Read Chapter 5)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="md:col-span-5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />

          <select
            value={form.courseId}
            onChange={(e) =>
              setForm({ ...form, courseId: e.target.value, topicId: '' })
            }
            className="md:col-span-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">General Study (No Course)</option>
            {data.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} — ${c.title}` : c.title}
              </option>
            ))}
          </select>

          <select
            value={form.topicId}
            onChange={(e) => setForm({ ...form, topicId: e.target.value })}
            className="md:col-span-4 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Any / All Topics</option>
            {(selectedCourse?.topics || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.status})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 md:grid-cols-12 items-center">
          <div className="col-span-2 md:col-span-3">
            <label className="block text-[10px] text-slate-400 mb-0.5">Study Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] text-slate-400 mb-0.5">Start Time</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] text-slate-400 mb-0.5">End Time</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] text-slate-400 mb-0.5">Duration ( mins )</label>
            <input
              type="number"
              min="10"
              step="5"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="col-span-1 md:col-span-1">
            <label className="block text-[10px] text-slate-400 mb-0.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Med</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-2 pt-3.5">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Session
            </button>
          </div>
        </div>
      </form>

      {/* WEEKLY 7-DAY CALENDAR GRID VIEW */}
      {viewMode === 'weekly' ? (
        <div className="space-y-3">
          {/* Week Navigation Bar */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white"
              >
                Starting Today
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs font-semibold text-slate-300">
              {formatNiceDate(weekDays[0])} — {formatNiceDate(weekDays[6])}
            </span>
          </div>

          {/* 7-Day Columns */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
            {weekDays.map((dateStr) => {
              const isToday = dateStr === today;
              const dayTasks = (data.tasks || [])
                .filter((t) => t.date === dateStr)
                .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

              const totalMins = dayTasks.reduce(
                (acc, t) => acc + (Number(t.estimatedMinutes) || 0),
                0
              );

              const [y, m, d] = dateStr.split('-').map(Number);
              const dt = new Date(y, m - 1, d);
              const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
              const monthDay = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div
                  key={dateStr}
                  className={`flex flex-col rounded-2xl border p-3 min-h-[290px] transition ${
                    isToday
                      ? 'border-indigo-500/70 bg-indigo-950/20'
                      : 'border-slate-800 bg-slate-900/50'
                  }`}
                >
                  {/* Day Header */}
                  <div
                    onClick={() => setForm({ ...form, date: dateStr })}
                    className="cursor-pointer flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5"
                    title="Click to set form date to this day"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold uppercase ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {dayName}
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-indigo-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                            TODAY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{monthDay}</p>
                    </div>
                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                      {formatMinutes(totalMins)}
                    </span>
                  </div>

                  {/* Tasks in Day */}
                  <div className="flex-1 space-y-2">
                    {dayTasks.length === 0 ? (
                      <button
                        onClick={() => setForm({ ...form, date: dateStr })}
                        className="w-full h-24 rounded-xl border border-dashed border-slate-800/80 text-[11px] text-slate-500 hover:border-slate-700 hover:text-slate-300 transition flex items-center justify-center"
                      >
                        + Schedule
                      </button>
                    ) : (
                      dayTasks.map((task) => {
                        const course = data.courses.find((c) => c.id === task.courseId);
                        const color = getCourseColor(course?.color);
                        return (
                          <div
                            key={task.id}
                            className={`rounded-xl border p-2.5 text-xs transition ${
                              task.completed
                                ? 'border-slate-800/50 bg-slate-900/30 opacity-55'
                                : `border-slate-800 bg-slate-900/95 hover:border-slate-700`
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <button
                                onClick={() => onToggleTask(task.id)}
                                className="mt-0.5 text-slate-400 hover:text-emerald-400 shrink-0"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <span
                                className={`flex-1 font-medium leading-snug ${
                                  task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                                }`}
                              >
                                {task.title}
                              </span>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-slate-600 hover:text-rose-400 shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                              {course ? (
                                <span className={`rounded px-1.5 py-0.5 font-medium ${color.bg} ${color.text}`}>
                                  {course.code}
                                </span>
                              ) : (
                                <span className="text-slate-500">General</span>
                              )}
                              <span>{task.startTime || `${task.estimatedMinutes}m`}</span>
                            </div>

                            {!task.completed && (
                              <button
                                onClick={() =>
                                  onStartFocusOnTarget({
                                    courseId: task.courseId || '',
                                    topicId: task.topicId || '',
                                    taskId: task.id
                                  })
                                }
                                className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 hover:text-white py-1 text-[10px] font-semibold text-indigo-300 transition"
                              >
                                <Play className="h-2.5 w-2.5 fill-current" />
                                Start Focus
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'UPCOMING', label: 'Upcoming' },
              { id: 'OVERDUE', label: 'Overdue' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'ALL', label: 'All Tasks' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setListFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  listFilter === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredListTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-400">
              No study tasks found in this view.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredListTasks.map((task) => {
                const course = data.courses.find((c) => c.id === task.courseId);
                const color = getCourseColor(course?.color);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            task.completed ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.notes && (
                          <p className="text-xs text-slate-400 mt-0.5">{task.notes}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {course && (
                            <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${color.bg} ${color.text}`}>
                              {course.code} — {course.title}
                            </span>
                          )}
                          <span>📅 {formatNiceDate(task.date)}</span>
                          {task.startTime && (
                            <span>
                              🕒 {task.startTime}{task.endTime ? `–${task.endTime}` : ''}
                            </span>
                          )}
                          <span>• {task.estimatedMinutes}m</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!task.completed && (
                        <button
                          onClick={() =>
                            onStartFocusOnTarget({
                              courseId: task.courseId || '',
                              topicId: task.topicId || '',
                              taskId: task.id
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 transition"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Focus
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
