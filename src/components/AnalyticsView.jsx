import React from 'react';
import {
  BarChart3,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  Trash2,
  Calendar
} from 'lucide-react';
import {
  getLocalDateString,
  addDays,
  formatMinutes,
  calculateStreak,
  getCourseColor,
  formatNiceDate
} from '../data/initialData';

export default function AnalyticsView({ data, onDeleteSession }) {
  const today = getLocalDateString();
  const sessions = data.sessions || [];
  const streak = calculateStreak(sessions);

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Last 14 days daily minutes
  const last14Days = Array.from({ length: 14 }, (_, idx) => {
    const dateStr = addDays(today, -(13 - idx));
    const mins = sessions
      .filter((s) => s.date === dateStr)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const [, m, d] = dateStr.split('-');
    return {
      dateStr,
      label: `${m}/${d}`,
      minutes: mins
    };
  });

  const maxDailyMins = Math.max(
    data.settings?.dailyGoalMinutes || 120,
    ...last14Days.map((d) => d.minutes),
    60
  );

  // Last 28 days consistency heatmap
  const last28Days = Array.from({ length: 28 }, (_, idx) => {
    const dateStr = addDays(today, -(27 - idx));
    const mins = sessions
      .filter((s) => s.date === dateStr)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    return { dateStr, minutes: mins };
  });

  // Course time breakdown
  const courseStats = data.courses.map((course) => {
    const mins = sessions
      .filter((s) => s.courseId === course.id)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const pct = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
    return {
      course,
      minutes: mins,
      pct
    };
  });

  const allTopics = data.courses.flatMap((c) => c.topics || []);
  const masteredCount = allTopics.filter((t) => t.status === 'Mastered').length;
  const inProgressCount = allTopics.filter((t) => t.status === 'In Progress').length;
  const notStartedCount = allTopics.filter((t) => t.status === 'Not Started').length;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          Study Analytics, Streaks & Time Distribution
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Visualize your daily study consistency, hours logged per course, and syllabus mastery progress.
        </p>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TOTAL STUDY TIME</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{formatMinutes(totalMinutes)}</p>
          <p className="mt-1 text-xs text-slate-400">Across {sessions.length} logged sessions</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CURRENT STREAK</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{streak} Days</p>
          <p className="mt-1 text-xs text-slate-400">Consistent daily study habit</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>14-DAY DAILY AVERAGE</span>
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatMinutes(
              Math.round(
                last14Days.reduce((s, d) => s + d.minutes, 0) / 14
              )
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Daily goal: {formatMinutes(data.settings?.dailyGoalMinutes || 120)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SYLLABUS TOPICS MASTERED</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {masteredCount} / {allTopics.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {inProgressCount} in progress • {notStartedCount} not started
          </p>
        </div>
      </div>

      {/* 14-Day Study Time Bar Chart & Course Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: 14-Day Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">Last 14 Days Study Output</h2>
              <p className="text-xs text-slate-400">Daily minutes logged vs your daily target</p>
            </div>
            <span className="text-xs text-indigo-400 font-medium">
              Goal: {formatMinutes(data.settings?.dailyGoalMinutes || 120)}/day
            </span>
          </div>

          <div className="h-52 flex items-end justify-between gap-2 pt-6 px-1 border-b border-slate-800">
            {last14Days.map((day) => {
              const heightPct = Math.round((day.minutes / maxDailyMins) * 100);
              const metGoal = day.minutes >= (data.settings?.dailyGoalMinutes || 120);
              const isToday = day.dateStr === today;

              return (
                <div
                  key={day.dateStr}
                  className="flex-1 flex flex-col items-center justify-end h-full group"
                >
                  <span className="mb-1 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                    {day.minutes}m
                  </span>
                  <div className="w-full max-w-[28px] bg-slate-800/60 rounded-t-lg h-36 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        metGoal
                          ? 'bg-emerald-500'
                          : day.minutes > 0
                          ? 'bg-indigo-500'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${Math.max(day.minutes > 0 ? 8 : 2, heightPct)}%` }}
                      title={`${formatNiceDate(day.dateStr)}: ${formatMinutes(day.minutes)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 px-1">
            {last14Days.map((day) => (
              <div key={day.dateStr} className="flex-1 text-center">
                <span
                  className={`text-[10px] ${
                    day.dateStr === today ? 'font-bold text-indigo-400' : 'text-slate-500'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Time Distribution by Course & 28-Day Heatmap */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">Time Allocation by Course</h2>
            <div className="space-y-3">
              {courseStats.map(({ course, minutes, pct }) => {
                const col = getCourseColor(course.color);
                return (
                  <div key={course.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200 truncate">{course.title}</span>
                      <span className="text-slate-400">
                        {formatMinutes(minutes)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${col.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 28-Day Study Consistency Heatmap */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">28-Day Consistency Grid</h2>
              <span className="text-[11px] text-slate-400">Last 4 Weeks</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {last28Days.map((d) => {
                let bgClass = 'bg-slate-800/80 border-slate-800 text-slate-500';
                if (d.minutes >= 120) {
                  bgClass = 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200';
                } else if (d.minutes >= 60) {
                  bgClass = 'bg-indigo-500/30 border-indigo-500/50 text-indigo-200';
                } else if (d.minutes > 0) {
                  bgClass = 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';
                }
                return (
                  <div
                    key={d.dateStr}
                    title={`${formatNiceDate(d.dateStr)}: ${formatMinutes(d.minutes)}`}
                    className={`rounded-lg border p-2 text-center text-[10px] font-medium ${bgClass}`}
                  >
                    <div>{d.dateStr.slice(8)}</div>
                    <div className="text-[9px] opacity-80">{d.minutes > 0 ? `${d.minutes}m` : '–'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Session Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-bold text-white mb-3">Complete Study Session History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="py-2.5 pr-4">Date</th>
                <th className="py-2.5 pr-4">Course</th>
                <th className="py-2.5 pr-4">Notes / Activity</th>
                <th className="py-2.5 pr-4">Duration</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sessions.map((s) => {
                const course = data.courses.find((c) => c.id === s.courseId);
                const col = getCourseColor(course?.color);
                return (
                  <tr key={s.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 pr-4 whitespace-nowrap text-slate-400">
                      {formatNiceDate(s.date)}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      {course ? (
                        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${col.bg} ${col.text}`}>
                          {course.code} — {course.title}
                        </span>
                      ) : (
                        <span className="text-slate-500">General</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-200">{s.notes || 'Study Session'}</td>
                    <td className="py-2.5 pr-4 font-semibold text-indigo-300">
                      {formatMinutes(s.durationMinutes)}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onDeleteSession(s.id)}
                        className="rounded p-1 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                        title="Remove session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
