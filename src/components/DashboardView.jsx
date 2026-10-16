import React from 'react';
import {
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  Brain,
  Play,
  Calendar,
  BookOpen,
  ArrowRight,
  Target,
  Award,
  Sparkles
} from 'lucide-react';
import {
  getLocalDateString,
  formatMinutes,
  calculateStreak,
  daysUntil,
  getCourseColor,
  formatNiceDate
} from '../data/initialData';

export default function DashboardView({
  data,
  onNavigate,
  onToggleTask,
  onStartFocusOnTarget
}) {
  const today = getLocalDateString();
  const streak = calculateStreak(data.sessions);

  const todayMinutes = data.sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const dailyGoal = data.settings?.dailyGoalMinutes || 120;
  const dailyProgressPct = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const allTopics = data.courses.flatMap((c) => c.topics || []);
  const masteredTopics = allTopics.filter((t) => t.status === 'Mastered').length;
  const masteryPct = allTopics.length > 0 ? Math.round((masteredTopics / allTopics.length) * 100) : 0;

  const dueFlashcards = (data.flashcards || []).filter(
    (card) => !card.nextReviewDate || card.nextReviewDate <= today
  );

  const todayTasks = (data.tasks || [])
    .filter((t) => t.date === today || (!t.completed && t.date < today))
    .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));

  const upcomingExams = [...data.courses]
    .filter((c) => c.examDate && daysUntil(c.examDate) >= 0)
    .sort((a, b) => a.examDate.localeCompare(b.examDate));

  return (
    <div className="space-y-6 pb-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Daily Study Command Center • {formatNiceDate(today)}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {data.settings?.userName || 'Scholar'}!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              You have <span className="text-indigo-300 font-semibold">{todayTasks.filter((t) => !t.completed).length} active tasks</span> for today and{' '}
              <span className="text-amber-300 font-semibold">{dueFlashcards.length} flashcards</span> ready for spaced repetition review.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('pomodoro')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition"
            >
              <Play className="h-4 w-4 fill-current" />
              Start Focus Session
            </button>
            <button
              onClick={() => onNavigate('planner')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition"
            >
              <Calendar className="h-4 w-4 text-indigo-400" />
              Plan Schedule
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Daily Focus Progress */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Today's Focus</span>
            <div className="rounded-lg bg-indigo-500/15 p-2 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{formatMinutes(todayMinutes)}</span>
            <span className="text-xs text-slate-400">/ {formatMinutes(dailyGoal)} goal</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${dailyProgressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">{dailyProgressPct}% of daily goal achieved</p>
        </div>

        {/* Study Streak */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Study Streak</span>
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{streak} {streak === 1 ? 'Day' : 'Days'}</span>
            <span className="text-xs text-emerald-400 font-medium">Active</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {todayMinutes > 0
              ? 'Today’s streak logged! Keep the momentum going.'
              : 'Log a study session today to extend your streak.'}
          </p>
        </div>

        {/* Topic Mastery */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Topic Mastery</span>
            <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{masteredTopics} / {allTopics.length}</span>
            <span className="text-xs text-emerald-400 font-medium">({masteryPct}%)</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">Across {data.courses.length} active courses</p>
        </div>

        {/* Spaced Repetition Due */}
        <div
          onClick={() => onNavigate('flashcards')}
          className="cursor-pointer rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 hover:border-violet-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Due Flashcards</span>
            <div className="rounded-lg bg-violet-500/15 p-2 text-violet-400">
              <Brain className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{dueFlashcards.length}</span>
            <span className="text-xs text-slate-400">of {data.flashcards.length} total cards</span>
          </div>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400">
            <span>Review due cards now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </p>
        </div>
      </div>

      {/* Main Two-Column Grid: Today's Study Agenda & Active Courses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Today's Study Agenda */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-400" />
                  Today's Study Agenda & Priority Tasks
                </h2>
                <p className="text-xs text-slate-400">Check off completed items or launch a direct Pomodoro session</p>
              </div>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Full Planner <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                <p className="text-sm text-slate-400">No tasks scheduled for today yet.</p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30"
                >
                  + Add Today's Study Tasks
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTasks.map((task) => {
                  const course = data.courses.find((c) => c.id === task.courseId);
                  const color = getCourseColor(course?.color);
                  const isOverdue = !task.completed && task.date < today;

                  return (
                    <div
                      key={task.id}
                      className={`group flex items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                        task.completed
                          ? 'border-slate-800/60 bg-slate-900/30 opacity-60'
                          : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                          title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                              }`}
                            >
                              {task.title}
                            </span>
                            {isOverdue && (
                              <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/30">
                                Overdue ({formatNiceDate(task.date)})
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            {course && (
                              <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${color.bg} ${color.text}`}>
                                {course.code || course.title}
                              </span>
                            )}
                            {task.startTime && (
                              <span className="text-slate-400">
                                🕒 {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
                              </span>
                            )}
                            <span>• {task.estimatedMinutes || 45}m est.</span>
                          </div>
                        </div>
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
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 px-2.5 py-1.5 text-xs font-medium text-indigo-300 transition"
                          title="Focus on this task in Pomodoro Timer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Focus
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Exam Countdowns Footer */}
          {upcomingExams.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                Upcoming Exam / Milestone Deadlines
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {upcomingExams.slice(0, 3).map((c) => {
                  const dLeft = daysUntil(c.examDate);
                  const col = getCourseColor(c.color);
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-2.5 flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-200 truncate">{c.title}</p>
                        <p className="text-[11px] text-slate-400">{formatNiceDate(c.examDate)}</p>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${col.bg} ${col.text}`}>
                        {dLeft === 0 ? 'Today!' : `${dLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Active Courses Progress */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                Courses & Syllabus Progress
              </h2>
              <p className="text-xs text-slate-400">Hours studied & topic mastery per subject</p>
            </div>
            <button
              onClick={() => onNavigate('courses')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {data.courses.map((course) => {
              const color = getCourseColor(course.color);
              const topics = course.topics || [];
              const mastered = topics.filter((t) => t.status === 'Mastered').length;
              const inProgress = topics.filter((t) => t.status === 'In Progress').length;
              const topicPct =
                topics.length > 0
                  ? Math.round(((mastered + inProgress * 0.4) / topics.length) * 100)
                  : 0;

              const courseSessionMinutes = data.sessions
                .filter((s) => s.courseId === course.id)
                .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

              return (
                <div
                  key={course.id}
                  onClick={() => onNavigate('courses')}
                  className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-3 w-3 rounded-full shrink-0 ${color.bar}`} />
                      <h3 className="text-sm font-semibold text-white truncate">{course.title}</h3>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${color.bg} ${color.text}`}>
                      {course.code}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {mastered}/{topics.length} topics mastered
                    </span>
                    <span>
                      {formatMinutes(courseSessionMinutes)} / {course.targetHours}h target
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                      style={{ width: `${topicPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
