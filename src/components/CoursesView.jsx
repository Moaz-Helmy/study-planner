import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  Star,
  BookOpen,
  Layers,
  Calendar,
  Edit3,
  X
} from 'lucide-react';
import {
  COURSE_COLORS,
  getCourseColor,
  formatMinutes,
  daysUntil,
  formatNiceDate
} from '../data/initialData';

const STATUS_ORDER = ['Not Started', 'In Progress', 'Mastered'];

const STATUS_BADGE = {
  'Not Started': 'bg-slate-800 text-slate-300 border-slate-700',
  'In Progress': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Mastered': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
};

export default function CoursesView({
  data,
  onUpdateCourses,
  onStartFocusOnTarget,
  onQuickLogTopicMinutes
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(
    data.courses[0]?.id || null
  );
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [courseForm, setCourseForm] = useState({
    title: '',
    code: '',
    color: 'indigo',
    targetHours: 30,
    examDate: '',
    description: ''
  });

  const [newTopic, setNewTopic] = useState({
    title: '',
    module: '',
    priority: 'High',
    estimatedMinutes: 60
  });

  const selectedCourse =
    data.courses.find((c) => c.id === selectedCourseId) || data.courses[0] || null;

  const openAddCourse = () => {
    setEditingCourse(null);
    setCourseForm({
      title: '',
      code: '',
      color: 'indigo',
      targetHours: 30,
      examDate: '',
      description: ''
    });
    setShowCourseModal(true);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      code: course.code || '',
      color: course.color || 'indigo',
      targetHours: course.targetHours || 30,
      examDate: course.examDate || '',
      description: course.description || ''
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return;

    if (editingCourse) {
      const updated = data.courses.map((c) =>
        c.id === editingCourse.id
          ? {
              ...c,
              ...courseForm,
              targetHours: Number(courseForm.targetHours) || 20
            }
          : c
      );
      onUpdateCourses(updated);
    } else {
      const created = {
        id: `course-${Date.now()}`,
        title: courseForm.title.trim(),
        code: courseForm.code.trim() || 'STUDY',
        color: courseForm.color,
        targetHours: Number(courseForm.targetHours) || 25,
        examDate: courseForm.examDate,
        description: courseForm.description.trim(),
        topics: []
      };
      onUpdateCourses([...data.courses, created]);
      setSelectedCourseId(created.id);
    }
    setShowCourseModal(false);
  };

  const handleDeleteCourse = (courseId) => {
    const remaining = data.courses.filter((c) => c.id !== courseId);
    onUpdateCourses(remaining);
    if (selectedCourseId === courseId) {
      setSelectedCourseId(remaining[0]?.id || null);
    }
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!selectedCourse || !newTopic.title.trim()) return;

    const topicObj = {
      id: `topic-${Date.now()}`,
      title: newTopic.title.trim(),
      module: newTopic.module.trim() || 'General',
      status: 'Not Started',
      priority: newTopic.priority,
      estimatedMinutes: Number(newTopic.estimatedMinutes) || 60,
      loggedMinutes: 0,
      confidence: 3
    };

    const updated = data.courses.map((c) =>
      c.id === selectedCourse.id
        ? { ...c, topics: [...(c.topics || []), topicObj] }
        : c
    );
    onUpdateCourses(updated);
    setNewTopic({ title: '', module: newTopic.module, priority: 'High', estimatedMinutes: 60 });
  };

  const handleCycleStatus = (topicId) => {
    if (!selectedCourse) return;
    const updated = data.courses.map((c) => {
      if (c.id !== selectedCourse.id) return c;
      return {
        ...c,
        topics: (c.topics || []).map((t) => {
          if (t.id !== topicId) return t;
          const nextIdx = (STATUS_ORDER.indexOf(t.status) + 1) % STATUS_ORDER.length;
          return { ...t, status: STATUS_ORDER[nextIdx] };
        })
      };
    });
    onUpdateCourses(updated);
  };

  const handleSetConfidence = (topicId, stars) => {
    if (!selectedCourse) return;
    const updated = data.courses.map((c) => {
      if (c.id !== selectedCourse.id) return c;
      return {
        ...c,
        topics: (c.topics || []).map((t) =>
          t.id === topicId ? { ...t, confidence: stars } : t
        )
      };
    });
    onUpdateCourses(updated);
  };

  const handleDeleteTopic = (topicId) => {
    if (!selectedCourse) return;
    const updated = data.courses.map((c) =>
      c.id === selectedCourse.id
        ? { ...c, topics: (c.topics || []).filter((t) => t.id !== topicId) }
        : c
    );
    onUpdateCourses(updated);
  };

  const filteredTopics = (selectedCourse?.topics || []).filter((t) =>
    statusFilter === 'ALL' ? true : t.status === statusFilter
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            Courses, Syllabus & Topic Breakdown
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Break subjects into actionable topics, track mastery & confidence, and launch focused study sessions.
          </p>
        </div>
        <button
          onClick={openAddCourse}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="h-4 w-4" />
          New Course / Subject
        </button>
      </div>

      {/* Main Split Layout: Course List (Left 4 Cols) + Selected Course Topics (Right 8 Cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Course Cards Column */}
        <div className="lg:col-span-4 space-y-3">
          {data.courses.map((course) => {
            const color = getCourseColor(course.color);
            const isSelected = selectedCourse?.id === course.id;
            const topics = course.topics || [];
            const masteredCount = topics.filter((t) => t.status === 'Mastered').length;
            const pct = topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0;
            const dLeft = daysUntil(course.examDate);

            const totalLogged = data.sessions
              .filter((s) => s.courseId === course.id)
              .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  isSelected
                    ? 'border-indigo-500 bg-slate-900 shadow-lg shadow-indigo-950/50'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${color.bg} ${color.text}`}>
                      {course.code}
                    </span>
                    <h3 className="mt-1.5 text-base font-bold text-white">{course.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCourse(course);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      title="Edit Course"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400"
                      title="Delete Course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {course.description && (
                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">{course.description}</p>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{masteredCount}/{topics.length} mastered ({pct}%)</span>
                  <span>{formatMinutes(totalLogged)} / {course.targetHours}h</span>
                </div>

                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${color.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {course.examDate && (
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      Exam: {formatNiceDate(course.examDate)}
                    </span>
                    {dLeft !== null && (
                      <span className={dLeft <= 7 && dLeft >= 0 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                        {dLeft < 0 ? 'Passed' : dLeft === 0 ? 'Today!' : `${dLeft} days left`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Course Topic Breakdown */}
        <div className="lg:col-span-8">
          {selectedCourse ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
              {/* Course Banner + Filter Pills */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    <h2 className="text-lg font-bold text-white">{selectedCourse.title} — Topics & Modules</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any status badge to cycle state (Not Started → In Progress → Mastered)
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['ALL', 'Not Started', 'In Progress', 'Mastered'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        statusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'All Topics' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Topic Quick Form */}
              <form
                onSubmit={handleAddTopic}
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 rounded-xl border border-slate-800/90 bg-slate-950/60 p-3"
              >
                <input
                  type="text"
                  placeholder="New topic or lecture title (e.g. Red-Black Trees)..."
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="sm:col-span-5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Module / Unit (e.g. Week 4)"
                  value={newTopic.module}
                  onChange={(e) => setNewTopic({ ...newTopic, module: e.target.value })}
                  className="sm:col-span-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="10"
                  step="5"
                  placeholder="Est. mins"
                  value={newTopic.estimatedMinutes}
                  onChange={(e) => setNewTopic({ ...newTopic, estimatedMinutes: e.target.value })}
                  className="sm:col-span-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  title="Estimated minutes to master"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Topic
                </button>
              </form>

              {/* Topics List */}
              {filteredTopics.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
                  No topics match this filter yet. Add a topic above to build your syllabus roadmap!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 hover:border-slate-700 transition"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleCycleStatus(topic.id)}
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                              STATUS_BADGE[topic.status] || STATUS_BADGE['Not Started']
                            }`}
                            title="Click to cycle topic status"
                          >
                            {topic.status}
                          </button>
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                            {topic.module}
                          </span>
                          <h4 className="text-sm font-semibold text-slate-100">{topic.title}</h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            Logged: <strong className="text-slate-200">{formatMinutes(topic.loggedMinutes)}</strong> / {formatMinutes(topic.estimatedMinutes)} est.
                          </span>

                          {/* Confidence Stars */}
                          <div className="flex items-center gap-1" title="Self-rated confidence (1-5 stars)">
                            <span className="text-[11px] text-slate-500 mr-0.5">Confidence:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleSetConfidence(topic.id, star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-3.5 w-3.5 ${
                                    star <= (topic.confidence || 0)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-700 hover:text-slate-500'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Topic Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onQuickLogTopicMinutes(selectedCourse.id, topic.id, 30)}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition"
                          title="Quickly log +30m studied on this topic"
                        >
                          +30m
                        </button>
                        <button
                          onClick={() =>
                            onStartFocusOnTarget({
                              courseId: selectedCourse.id,
                              topicId: topic.id,
                              taskId: ''
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 transition"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Focus
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400 transition"
                          title="Delete topic"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <p className="text-slate-400">Create or select a course on the left to manage its topics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCourse ? 'Edit Course' : 'Add New Course / Subject'}
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-305"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Study Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={courseForm.targetHours}
                    onChange={(e) => setCourseForm({ ...courseForm, targetHours: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Exam / Target Date</label>
                  <input
                    type="date"
                    value={courseForm.examDate}
                    onChange={(e) => setCourseForm({ ...courseForm, examDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Theme Color</label>
                  <select
                    value={courseForm.color}
                    onChange={(e) => setCourseForm({ ...courseForm, color: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {COURSE_COLORS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Syllabus Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key objectives, textbook, or grading breakdown..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
