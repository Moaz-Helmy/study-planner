import React, { useState } from 'react';
import {
  Brain,
  FileText,
  Plus,
  Trash2,
  RotateCw,
  Lightbulb,
  CheckCircle2,
  Pin,
  Search,
  Layers
} from 'lucide-react';
import {
  getLocalDateString,
  computeNextFlashcardReview,
  formatNiceDate,
  getCourseColor
} from '../data/initialData';

export default function FlashcardsNotesView({
  data,
  onUpdateFlashcards,
  onUpdateNotes
}) {
  const today = getLocalDateString();
  const [subTab, setSubTab] = useState('flashcards'); // 'flashcards' | 'notes'
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [practiceAllMode, setPracticeAllMode] = useState(false);

  // Flashcard Review State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // New Flashcard Form
  const [cardForm, setCardForm] = useState({
    courseId: data.courses[0]?.id || '',
    front: '',
    back: '',
    hint: ''
  });

  // Notes State
  const [selectedNoteId, setSelectedNoteId] = useState(data.notes?.[0]?.id || null);
  const [noteSearch, setNoteSearch] = useState('');

  // Filtered Flashcards for Review
  const deckCards = (data.flashcards || []).filter((c) =>
    courseFilter === 'ALL' ? true : c.courseId === courseFilter
  );

  const reviewQueue = deckCards.filter((c) =>
    practiceAllMode ? true : !c.nextReviewDate || c.nextReviewDate <= today
  );

  const activeCard = reviewQueue[currentIndex] || reviewQueue[0] || null;

  const handleRateCard = (rating) => {
    if (!activeCard) return;
    const reviewUpdate = computeNextFlashcardReview(activeCard, rating);
    const updatedCards = (data.flashcards || []).map((c) =>
      c.id === activeCard.id ? { ...c, ...reviewUpdate } : c
    );
    onUpdateFlashcards(updatedCards);
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex >= reviewQueue.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.back.trim()) return;

    const newCard = {
      id: `card-${Date.now()}`,
      courseId: cardForm.courseId,
      front: cardForm.front.trim(),
      back: cardForm.back.trim(),
      hint: cardForm.hint.trim(),
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      lastReviewed: null,
      nextReviewDate: today
    };

    onUpdateFlashcards([newCard, ...(data.flashcards || [])]);
    setCardForm({ ...cardForm, front: '', back: '', hint: '' });
  };

  const handleDeleteCard = (id) => {
    onUpdateFlashcards((data.flashcards || []).filter((c) => c.id !== id));
  };

  // Notes handlers
  const filteredNotes = (data.notes || [])
    .filter((n) => {
      const matchesCourse = courseFilter === 'ALL' || n.courseId === courseFilter;
      const q = noteSearch.toLowerCase();
      const matchesQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesCourse && matchesQuery;
    })
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  const activeNote =
    (data.notes || []).find((n) => n.id === selectedNoteId) || filteredNotes[0] || null;

  const handleCreateNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      courseId: courseFilter === 'ALL' ? data.courses[0]?.id || '' : courseFilter,
      title: 'Untitled Study Note',
      pinned: false,
      tags: ['Summary'],
      updatedAt: today,
      content: 'Write your key formulas, definitions, and exam takeaways here...'
    };
    onUpdateNotes([newNote, ...(data.notes || [])]);
    setSelectedNoteId(newNote.id);
  };

  const handleUpdateActiveNote = (patch) => {
    if (!activeNote) return;
    const updated = (data.notes || []).map((n) =>
      n.id === activeNote.id ? { ...n, ...patch, updatedAt: today } : n
    );
    onUpdateNotes(updated);
  };

  const handleDeleteNote = (id) => {
    const remaining = (data.notes || []).filter((n) => n.id !== id);
    onUpdateNotes(remaining);
    if (selectedNoteId === id) {
      setSelectedNoteId(remaining[0]?.id || null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-400" />
            Spaced Repetition Flashcards & Study Notes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active recall with SM-2 interval scheduling plus structured revision notes per subject.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Courses</option>
            {data.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              onClick={() => setSubTab('flashcards')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                subTab === 'flashcards'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              Flashcards ({data.flashcards?.length || 0})
            </button>
            <button
              onClick={() => setSubTab('notes')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                subTab === 'notes'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Study Notes ({data.notes?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {subTab === 'flashcards' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Cols: Interactive Spaced Repetition Reviewer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300 border border-violet-500/30">
                    {practiceAllMode
                      ? `Practice Mode (${reviewQueue.length} cards)`
                      : `Due for Review Today (${reviewQueue.length})`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPracticeAllMode((p) => !p);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {practiceAllMode ? 'Show Only Due Cards' : 'Practice All Cards in Deck'}
                </button>
              </div>

              {activeCard ? (
                <div className="space-y-4">
                  {/* Flashcard Box */}
                  <div
                    onClick={() => setIsFlipped((f) => !f)}
                    className="cursor-pointer min-h-[240px] rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 flex flex-col justify-between shadow-xl hover:border-indigo-500/50 transition"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Card {currentIndex + 1} of {reviewQueue.length}
                      </span>
                      <span className="inline-flex items-center gap-1 text-indigo-400 font-medium">
                        <RotateCw className="h-3.5 w-3.5" />
                        {isFlipped ? 'Showing Answer (Click to flip)' : 'Question (Click to reveal answer)'}
                      </span>
                    </div>

                    <div className="my-6 text-center px-2">
                      {!isFlipped ? (
                        <p className="text-lg font-semibold text-white leading-relaxed">
                          {activeCard.front}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                            Answer
                          </span>
                          <p className="text-base font-medium text-emerald-100 leading-relaxed">
                            {activeCard.back}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>
                        Interval: {activeCard.interval || 0}d • Ease: {activeCard.easeFactor || 2.5}
                      </span>
                      {activeCard.hint && !isFlipped && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint((h) => !h);
                          }}
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                          {showHint ? activeCard.hint : 'Show Hint'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SM-2 Rating Controls */}
                  {!isFlipped ? (
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
                    >
                      Show Answer
                    </button>
                  ) : (
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { id: 'again', label: 'Again', sub: '1d reset', style: 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25' },
                        { id: 'hard', label: 'Hard', sub: `${ computeNextFlashcardReview(activeCard, 'hard').interval }d`, style: 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' },
                        { id: 'good', label: 'Good', sub: `${ computeNextFlashcardReview(activeCard, 'good').interval }d`, style: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' },
                        { id: 'easy', label: 'Easy', sub: `${ computeNextFlashcardReview(activeCard, 'easy').interval }d`, style: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25' }
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => handleRateCard(btn.id)}
                          className={`rounded-xl border py-2.5 px-2 text-center transition ${btn.style}`}
                        >
                          <div className="text-xs font-bold">{btn.label}</div>
                          <div className="text-[10px] opacity-80">Next: {btn.sub}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">All Caught Up for Today!</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    You have reviewed all flashcards scheduled for today. You can add new cards on the right or practice the full deck anytime.
                  </p>
                  {deckCards.length > 0 && (
                    <button
                      onClick={() => setPracticeAllMode(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30"
                    >
                      Practice All {deckCards.length} Cards Now
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Deck Browser List */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Flashcard Deck ({deckCards.length})
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {deckCards.map((card) => {
                  const course = data.courses.find((c) => c.id === card.courseId);
                  const col = getCourseColor(course?.color);
                  return (
                    <div
                      key={card.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {course && (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${col.bg} ${col.text}`}>
                              {course.code}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            Next review: <strong className="text-slate-200">{formatNiceDate(card.nextReviewDate)}</strong>
                          </span>
                        </div>
                        <p className="font-semibold text-slate-100">{card.front}</p>
                        <p className="text-slate-400">{card.back}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Create New Flashcard */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleAddCard}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
            >
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400" />
                Create New Flashcard
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course</label>
                <select
                  value={cardForm.courseId}
                  onChange={(e) => setCardForm({ ...cardForm, courseId: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Front (Question / Prompt) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. State the Master Theorem conditions for recurrence T(n) = aT(n/b) + f(n)"
                  value={cardForm.front}
                  onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Back (Answer / Explanation) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write a clear, concise answer for active recall..."
                  value={cardForm.back}
                  onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Optional Memory Hint
                </label>
                <input
                  type="text"
                  placeholder="e.g. Compare f(n) against n^(log_b(a))"
                  value={cardForm.hint}
                  onChange={(e) => setCardForm({ ...cardForm, hint: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
              >
                + Add Card to Spaced Repetition Deck
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* STUDY NOTES SPLIT VIEW */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 4 Cols: Notes List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search study notes..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleCreateNote}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                New Note
              </button>
            </div>

            <div className="space-y-2.5">
              {filteredNotes.map((note) => {
                const course = data.courses.find((c) => c.id === note.courseId);
                const col = getCourseColor(course?.color);
                const isSelected = activeNote?.id === note.id;

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-slate-900 shadow-lg'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white line-clamp-1">{note.title}</h4>
                      {note.pinned && <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0 fill-current" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{note.content}</p>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                      {course ? (
                        <span className={`rounded px-1.5 py-0.5 font-medium ${col.bg} ${col.text}`}>
                          {course.code}
                        </span>
                      ) : (
                        <span>General</span>
                      )}
                      <span>Updated {formatNiceDate(note.updatedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 8 Cols: Note Editor */}
          <div className="lg:col-span-8">
            {activeNote ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                    className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none"
                    placeholder="Note Title..."
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={activeNote.courseId}
                      onChange={(e) => handleUpdateActiveNote({ courseId: e.target.value })}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">General</option>
                      {data.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleUpdateActiveNote({ pinned: !activeNote.pinned })}
                      className={`rounded-lg border p-1.5 transition ${
                        activeNote.pinned
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Pin note to top"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-400"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={16}
                  value={activeNote.content}
                  onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                  placeholder="Write your study notes, formulas, summaries, or exam checklists..."
                  className="w-full rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 font-mono text-xs leading-relaxed text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-400">
                Select a study note on the left or create a new one.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
