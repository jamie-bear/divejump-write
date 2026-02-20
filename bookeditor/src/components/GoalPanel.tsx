import { useState } from 'react';
import { Target, X, TrendingUp, Calendar, CheckCircle2, BookText } from 'lucide-react';
import { useBookStore } from '../store/bookStore';
import type { DailyGoal } from '../types';

// ── SVG ring for daily goal ──────────────────────────────────────────────────

function GoalRing({ pct }: { pct: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const done = pct >= 100;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e7e5e4" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none"
        stroke={done ? '#10b981' : '#6366f1'} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill={done ? '#059669' : '#374151'}>
        {pct}%
      </text>
      <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#9ca3af">
        {done ? 'Complete!' : 'of goal'}
      </text>
    </svg>
  );
}

// ── Manuscript arc (total word count) ────────────────────────────────────────

function ManuscriptArc({ written, goal }: { written: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, (written / goal) * 100) : 0;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const done = pct >= 100;

  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        {/* Track */}
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f5f5f4" strokeWidth="10" />
        {/* Progress */}
        <circle cx="65" cy="65" r={r} fill="none"
          stroke={done ? '#10b981' : '#818cf8'} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        {/* Center text */}
        <text x="65" y="58" textAnchor="middle" fontSize="13" fontWeight="700" fill={done ? '#059669' : '#1c1917'}>
          {written.toLocaleString()}
        </text>
        <text x="65" y="72" textAnchor="middle" fontSize="9" fill="#a8a29e">
          of {goal.toLocaleString()}
        </text>
        <text x="65" y="84" textAnchor="middle" fontSize="9" fill={done ? '#059669' : '#a8a29e'}>
          {done ? '✓ Done!' : 'words'}
        </text>
      </svg>
      <div className="text-xs text-stone-500 mt-1">
        {goal > written
          ? `${(goal - written).toLocaleString()} words remaining`
          : 'Manuscript goal reached!'}
      </div>
    </div>
  );
}

// ── History bar ──────────────────────────────────────────────────────────────

function HistoryBar({ goal }: { goal: DailyGoal }) {
  const pct = goal.target > 0 ? Math.min(100, (goal.wordsWritten / goal.target) * 100) : 0;
  const done = pct >= 100;
  const date = new Date(goal.date);
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-indigo-400'}`}
          style={{ width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
      <span className="text-xs text-stone-500 w-16 text-right flex-shrink-0">
        {goal.wordsWritten.toLocaleString()}
      </span>
      {done && <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export default function GoalPanel() {
  const { book, getTodayGoal, setDailyGoal, setWordCountGoal, getTotalWordCount, toggleGoalPanel } = useBookStore();
  const [editDailyGoal, setEditDailyGoal] = useState(false);
  const [dailyInput, setDailyInput] = useState(String(book.dailyGoal));
  const [editWordGoal, setEditWordGoal] = useState(false);
  const [wordGoalInput, setWordGoalInput] = useState(String(book.wordCountGoal));

  const todayGoal = getTodayGoal();
  const totalWords = getTotalWordCount();
  const pct = book.dailyGoal > 0
    ? Math.min(100, Math.round((todayGoal.wordsWritten / book.dailyGoal) * 100))
    : 0;

  const last7 = book.goalHistory
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const streakDays = computeStreak(book.goalHistory, book.dailyGoal);

  const handleSaveDailyGoal = () => {
    const n = parseInt(dailyInput, 10);
    if (n > 0) setDailyGoal(n);
    setEditDailyGoal(false);
  };

  const handleSaveWordGoal = () => {
    const n = parseInt(wordGoalInput, 10);
    if (n > 0) setWordCountGoal(n);
    setEditWordGoal(false);
  };

  return (
    <div className="w-72 flex-shrink-0 bg-white border-l border-stone-200 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-stone-700">Writing Goals</span>
        </div>
        <button onClick={toggleGoalPanel} className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Manuscript total goal ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <BookText size={12} /> Manuscript
            </h3>
            <button
              onClick={() => { setWordGoalInput(String(book.wordCountGoal)); setEditWordGoal(!editWordGoal); }}
              className="text-xs text-indigo-600 hover:underline"
            >
              {editWordGoal ? 'Cancel' : 'Set goal'}
            </button>
          </div>

          <ManuscriptArc written={totalWords} goal={book.wordCountGoal} />

          {editWordGoal && (
            <div className="flex gap-2 mt-3">
              <input type="number" min="1000" step="1000" value={wordGoalInput}
                onChange={(e) => setWordGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveWordGoal()}
                className="flex-1 border border-stone-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-400" />
              <button onClick={handleSaveWordGoal}
                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">
                Save
              </button>
            </div>
          )}

          {!editWordGoal && (
            <div className="flex gap-2 flex-wrap mt-2 justify-center">
              {[50000, 80000, 100000, 120000].map((n) => (
                <button key={n} onClick={() => setWordCountGoal(n)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    book.wordCountGoal === n
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-stone-300 text-stone-500 hover:border-violet-400 hover:text-violet-600'
                  }`}>
                  {(n / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-stone-100" />

        {/* ── Daily session goal ── */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
            <Calendar size={12} /> Today
          </h3>
          <GoalRing pct={pct} />
          <div className="text-center mt-2 space-y-0.5">
            <p className="text-2xl font-bold text-stone-800">{todayGoal.wordsWritten.toLocaleString()}</p>
            <p className="text-xs text-stone-400">of {book.dailyGoal.toLocaleString()} word daily goal</p>
            {book.dailyGoal > todayGoal.wordsWritten && (
              <p className="text-xs text-stone-500 mt-1">
                {(book.dailyGoal - todayGoal.wordsWritten).toLocaleString()} words to go
              </p>
            )}
          </div>

          {/* Daily goal controls */}
          <div className="bg-stone-50 rounded-xl p-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-stone-600">Daily Target</span>
              <button onClick={() => { setDailyInput(String(book.dailyGoal)); setEditDailyGoal(!editDailyGoal); }}
                className="text-xs text-indigo-600 hover:underline">
                {editDailyGoal ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editDailyGoal ? (
              <div className="flex gap-2">
                <input type="number" min="1" max="10000" value={dailyInput}
                  onChange={(e) => setDailyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveDailyGoal()}
                  className="flex-1 border border-stone-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-400" />
                <button onClick={handleSaveDailyGoal}
                  className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors">
                  Save
                </button>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {[500, 1000, 1500, 2000].map((n) => (
                  <button key={n} onClick={() => setDailyGoal(n)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      book.dailyGoal === n
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-stone-300 text-stone-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}>
                    {n.toLocaleString()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-stone-800">{totalWords.toLocaleString()}</p>
            <p className="text-xs text-stone-400 mt-0.5">Total words</p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-stone-800">{streakDays} 🔥</p>
            <p className="text-xs text-stone-400 mt-0.5">Day streak</p>
          </div>
        </div>

        {/* ── History ── */}
        {last7.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} /> Last 7 Days
            </h3>
            <div className="space-y-2">
              {last7.map((g) => <HistoryBar key={g.date} goal={g} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function computeStreak(history: { date: string; wordsWritten: number; target: number }[], goal: number): number {
  if (!history.length) return 0;
  const sorted = history.slice().sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const entry of sorted) {
    if (entry.wordsWritten >= (entry.target || goal)) streak++;
    else break;
  }
  return streak;
}
