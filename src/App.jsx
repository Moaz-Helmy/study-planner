import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Clock,
  Brain,
  BarChart3,
  Settings,
  Flame,
  CheckCircle2,
  Play,
  Pause,
  GraduationCap,
  Database
} from 'lucide-react';
import {
  createInitialData,
  getLocalDateString,
  calculateStreak,
  formatMinutes,
  playCompletionChime
} from './data/initialData';
import DashboardView from './components/DashboardView';
import CoursesView from './components/CoursesView';
import PlannerView from './components/PlannerView';
import PomodoroView from './components/PomodoroView';
import FlashcardsNotesView from './components/FlashcardsNotesView';
import AnalyticsView from './components/AnalyticsView';
import SettingsModal from './components/SettingsModal';

const LOCAL_STORAGE_KEY = 'studyflow_desktop_data_v1';

export default function App() {
  const [data, setData] = useState(() => createInitialData());
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbPath, setDbPath] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Persistent Pomodoro State across tabs
  const [timerState, setTimerState] = useState({
    mode: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
    secondsLeft: 25 * 60,
    totalSeconds: 25 * 60,
    isRunning: false,
    courseId: 'course-1',
    topicId: 'topic-102',
    taskId: '',
    sessionNotes: ''
  });

  // Load initial database from Electron JSON file or localStorage
  useEffect(() => {
    let mounted = true;
    async function initLoad() {
      try {
        if (window.electronAPI?.loadData) {
          const res = await window.electronAPI.loadData();
          if (mounted && res) {
            setDbPath(res.dbPath || '');
            if (res.data && res.data.courses) {
              setData(res.data);
              setIsLoaded(true);
              return;
            } else {
              // Save initial starter data to disk immediately
              const starter = createInitialData();
              await window.electronAPI.saveData(starter);
              setData(starter);
              setIsLoaded(true);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Electron load error:', err);
      }

      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (mounted && parsed && parsed.courses) {
            setData(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
      if (mounted) setIsLoaded(true);
    }
    initLoad();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-save whenever `data` changes after initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
    if (window.electronAPI?.saveData) {
      window.electronAPI.saveData(data);
    }
  }, [data, isLoaded]);

  // Ref to latest data/timerState for interval completion callback
  const stateRef = useRef({ data, timerState });
  useEffect(() => {
    stateRef.current = { data, timerState };
  }, [data, timerState]);

  const recordStudySession = ({ courseId, topicId, taskId, durationMinutes, date, notes }) => {
    const mins = Math.max(1, Math.round(Number(durationMinutes) || 25));
    const sessionDate = date || getLocalDateString();
    const newSession = {
      id: `sess-${Date.now()}`,
      courseId: courseId || '',
      topicId: topicId || '',
      date: sessionDate,
      durationMinutes: mins,
      mode: 'Focus',
      notes: notes || 'Pomodoro Focus Session',
      timestamp: new Date().toISOString()
    };

    setData((prev) => {
      const updatedCourses = prev.courses.map((course) => {
        if (course.id !== courseId) return course;
        return {
          ...course,
          topics: (course.topics || []).map((t) => {
            if (t.id !== topicId) return t;
            const nextLogged = (t.loggedMinutes || 0) + mins;
            const nextStatus = t.status === 'Not Started' ? 'In Progress' : t.status;
            return { ...t, loggedMinutes: nextLogged, status: nextStatus };
          })
        };
      });

      const updatedTasks = (prev.tasks || []).map((t) =>
        taskId && t.id === taskId ? { ...t, completed: true } : t
      );

      return {
        ...prev,
        courses: updatedCourses,
        tasks: updatedTasks,
        sessions: [newSession, ...(prev.sessions || [])]
      };
    });

    showToast(`Logged +${mins}m study session!`);
  };

  // Global Pomodoro 1-second ticker
  useEffect(() => {
    if (!timerState.isRunning) return;

    const interval = setInterval(() => {
      setTimerState((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }

        // Timer hit 0!
        const { data: currentData } = stateRef.current;
        if (currentData.settings?.soundEnabled !== false) {
          playCompletionChime();
        }

        const completedMins = Math.max(1, Math.round(prev.totalSeconds / 60));
        if (prev.mode === 'focus') {
          if (window.electronAPI?.notify) {
            window.electronAPI.notify({
              title: 'Focus Session Complete! 🎉',
              body: `Great job! ${completedMins} minutes logged to your study planner.`
            });
          }
          setTimeout(() => {
            recordStudySession({
              courseId: prev.courseId,
              topicId: prev.topicId,
              taskId: prev.taskId,
              durationMinutes: completedMins,
              date: getLocalDateString(),
              notes: prev.sessionNotes || 'Completed Pomodoro Focus Block'
            });
          }, 0);
        } else {
          if (window.electronAPI?.notify) {
            window.electronAPI.notify({
              title: 'Break Finished!',
              body: 'Ready to start your next focus block?'
            });
          }
        }

        return {
          ...prev,
          isRunning: false,
          secondsLeft: prev.totalSeconds
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isRunning]);

  // Timer Handlers
  const getDurationForMode = (mode, settings = data.settings) => {
    if (mode === 'shortBreak') return (settings?.pomodoroShortBreakMinutes || 5) * 60;
    if (mode === 'longBreak') return (settings?.pomodoroLongBreakMinutes || 15) * 60;
    return (settings?.pomodoroFocusMinutes || 25) * 60;
  };

  const handleStartPauseTimer = () => {
    setTimerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleResetTimer = () => {
    setTimerState((prev) => {
      const secs = getDurationForMode(prev.mode);
      return { ...prev, isRunning: false, secondsLeft: secs, totalSeconds: secs };
    });
  };

  const handleSwitchMode = (newMode) => {
    const secs = getDurationForMode(newMode);
    setTimerState((prev) => ({
      ...prev,
      mode: newMode,
      isRunning: false,
      secondsLeft: secs,
      totalSeconds: secs
    }));
  };

  const handleChangeTimerTarget = (patch) => {
    setTimerState((prev) => ({ ...prev, ...patch }));
  };

  const handleCompleteSessionNow = (elapsedMinutes) => {
    const minsToLog =
      timerState.secondsLeft < timerState.totalSeconds
        ? elapsedMinutes
        : Math.round(timerState.totalSeconds / 60);

    if (data.settings?.soundEnabled !== false) {
      playCompletionChime();
    }

    recordStudySession({
      courseId: timerState.courseId,
      topicId: timerState.topicId,
      taskId: timerState.taskId,
      durationMinutes: minsToLog,
      date: getLocalDateString(),
      notes: timerState.sessionNotes || 'Focus Session'
    });

    handleResetTimer();
  };

  const handleStartFocusOnTarget = ({ courseId, topicId, taskId }) => {
    const focusSecs = getDurationForMode('focus');
    const linkedTask = (data.tasks || []).find((t) => t.id === taskId);
    setTimerState({
      mode: 'focus',
      secondsLeft: focusSecs,
      totalSeconds: focusSecs,
      isRunning: true,
      courseId: courseId || data.courses[0]?.id || '',
      topicId: topicId || '',
      taskId: taskId || '',
      sessionNotes: linkedTask ? `Task: ${linkedTask.title}` : ''
    });
    setActiveTab('pomodoro');
    showToast('Focus Timer started!');
  };

  const handleToggleTask = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const handleQuickLogTopicMinutes = (courseId, topicId, mins) => {
    const course = data.courses.find((c) => c.id === courseId);
    const topic = course?.topics?.find((t) => t.id === topicId);
    recordStudySession({
      courseId,
      topicId,
      durationMinutes: mins,
      date: getLocalDateString(),
      notes: topic ? `Studied ${topic.title}` : 'Quick Topic Study'
    });
  };

  // Database Backup / Restore Handlers
  const handleExportBackup = async () => {
    if (window.electronAPI?.exportBackup) {
      const res = await window.electronAPI.exportBackup(data);
      if (res?.ok) {
        showToast('Backup exported successfully!');
      }
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyflow-backup-${getLocalDateString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup downloaded!');
    }
  };

  const handleImportBackup = async () => {
    if (window.electronAPI?.importBackup) {
      const res = await window.electronAPI.importBackup();
      if (res?.ok && res.data?.courses) {
        setData(res.data);
        showToast('Database backup imported!');
      }
    }
  };

  const handleRevealDbFolder = () => {
    if (window.electronAPI?.revealDbInFolder) {
      window.electronAPI.revealDbInFolder();
    }
  };

  const streak = calculateStreak(data.sessions);
  const today = getLocalDateString();
  const dueCardsCount = (data.flashcards || []).filter(
    (c) => !c.nextReviewDate || c.nextReviewDate <= today
  ).length;
  const pendingTodayTasks = (data.tasks || []).filter(
    (t) => !t.completed && t.date <= today
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses & Topics', icon: BookOpen, badge: data.courses.length },
    { id: 'planner', label: 'Study Planner', icon: Calendar, badge: pendingTodayTasks || null },
    { id: 'pomodoro', label: 'Pomodoro Timer', icon: Clock, live: timerState.isRunning },
    { id: 'flashcards', label: 'Cards & Notes', icon: Brain, badge: dueCardsCount || null },
    { id: 'analytics', label: 'Analytics & Logs', icon: BarChart3 }
  ];

  const miniMins = Math.floor(timerState.secondsLeft / 60);
  const miniSecs = timerState.secondsLeft % 60;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Left Desktop Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-slate-800/80 bg-slate-900/75 p-4 shrink-0">
        <div className="space-y-6">
          {/* App Brand Header */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white">StudyFlow</h1>
              <p className="text-[11px] font-medium text-slate-400">Personal Study Studio</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.live ? (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  ) : item.badge ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Mini Live Timer Widget in Sidebar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Focus Timer</span>
              <span className={timerState.isRunning ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                {timerState.isRunning ? 'Running' : 'Idle'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                onClick={() => setActiveTab('pomodoro')}
                className="cursor-pointer font-mono text-xl font-bold text-white hover:text-indigo-400 transition"
              >
                {String(miniMins).padStart(2, '0')}:{String(miniSecs).padStart(2, '0')}
              </span>
              <button
                onClick={handleStartPauseTimer}
                className={`rounded-lg p-2 text-white transition ${
                  timerState.isRunning
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
                title={timerState.isRunning ? 'Pause timer' : 'Start timer'}
              >
                {timerState.isRunning ? (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Streak & Settings Footer */}
        <div className="space-y-2 border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Flame className="h-4 w-4 text-amber-400" />
              Current Streak
            </span>
            <span className="font-bold text-amber-300">{streak}d</span>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings & Data Backup
            </span>
            <Database className="h-3.5 w-3.5 text-emerald-400" title="Auto-saved locally" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-2xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        <div className="mx-auto max-w-6xl">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              onNavigate={setActiveTab}
              onToggleTask={handleToggleTask}
              onStartFocusOnTarget={handleStartFocusOnTarget}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesView
              data={data}
              onUpdateCourses={(courses) => setData((prev) => ({ ...prev, courses }))}
              onStartFocusOnTarget={handleStartFocusOnTarget}
              onQuickLogTopicMinutes={handleQuickLogTopicMinutes}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView
              data={data}
              onUpdateTasks={(tasks) => setData((prev) => ({ ...prev, tasks }))}
              onToggleTask={handleToggleTask}
              onStartFocusOnTarget={handleStartFocusOnTarget}
            />
          )}

          {activeTab === 'pomodoro' && (
            <PomodoroView
              data={data}
              timerState={timerState}
              onStartPauseTimer={handleStartPauseTimer}
              onResetTimer={handleResetTimer}
              onSwitchMode={handleSwitchMode}
              onChangeTimerTarget={handleChangeTimerTarget}
              onCompleteSessionNow={handleCompleteSessionNow}
              onLogManualSession={(payload) => recordStudySession(payload)}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsNotesView
              data={data}
              onUpdateFlashcards={(flashcards) =>
                setData((prev) => ({ ...prev, flashcards }))
              }
              onUpdateNotes={(notes) => setData((prev) => ({ ...prev, notes }))}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              data={data}
              onDeleteSession={(id) =>
                setData((prev) => ({
                  ...prev,
                  sessions: (prev.sessions || []).filter((s) => s.id !== id)
                }))
              }
            />
          )}
        </div>
      </main>

      {showSettings && (
        <SettingsModal
          data={data}
          dbPath={dbPath}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={(settings) => {
            setData((prev) => ({ ...prev, settings }));
            setTimerState((prev) => {
              if (prev.isRunning) return prev;
              const nextTotal = getDurationForMode(prev.mode, settings);
              return { ...prev, secondsLeft: nextTotal, totalSeconds: nextTotal };
            });
          }}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onRevealDbFolder={handleRevealDbFolder}
          onResetSampleData={() => {
            setData(createInitialData());
            setShowSettings(false);
            showToast('Restored starter sample data!');
          }}
          onClearAllData={() => {
            setData({
              settings: data.settings,
              courses: [],
              tasks: [],
              sessions: [],
              flashcards: [],
              notes: []
            });
            setShowSettings(false);
            showToast('Cleared all study data!');
          }}
        />
      )}
    </div>
  );
}
