import { useState } from 'react';
import { Target, X, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { useBookStore } from '../store/bookStore';
import type { DailyGoal } from '../types';

function GoalRing({ pct }: { pct: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const done = pct >= 100;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e7e5e4" strokeWidth="8" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={done ? '#10b981' : '#6366f1'}
        strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x="50"
        y="46"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-stone-700 text-lg font-bold"
        fontSize="18"
        fontWeight="700"
        fill={done ? '#059669' : '#374151'}
      >
        {pct}%
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontSize="9"
        fill="#9ca3af"
      >
        {done ? 'Complete!' : 'of goal'}
      </text>
    </svg>
  );
}

function HistoryBar({ goal }: { goal: DailyGoal }) {
  const pct = goal.target > 0 ? Math.min(100, (goal.wordsWritten / goal.target) * 100) : 0;
  const done = pct >= 100;
  const date = new Date(goal.date);
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-indigo-400'}`}
          style={{ width: `${pct}%`, transition: 'width 0.3s' }}
        />
      </div>
      <span className="text-xs text-stone-500 w-16 text-right flex-shrink-0">
        {goal.wordsWritten.toLocaleString()}
      </span>
      {done && <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />}
    </div>
  );
}

export default function GoalPanel() {
  const { book, getTodayGoal, setDailyGoal, getTotalWordCount, toggleGoalPanel } = useBookStore();
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(book.dailyGoal));

  const todayGoal = getTodayGoal();
  const pct =
    book.dailyGoal > 0
      ? Math.min(100, Math.round((todayGoal.wordsWritten / book.dailyGoal) * 100))
      : 0;

  const totalWords = getTotalWordCount();

  const last7 = book.goalHistory
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const handleSaveGoal = () => {
    const n = parseInt(goalInput, 10);
    if (n > 0) setDailyGoal(n);
    setEditGoal(false);
  };

  const streakDays = computeStreak(book.goalHistory, book.dailyGoal);

  return (
    <div className="w-72 flex-shrink-0 bg-white border-l border-stone-200 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-stone-700">Writing Goals</span>
        </div>
        <button
          onClick={toggleGoalPanel}
          className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Today's progress ring */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
            <Calendar size={12} /> Today
          </h3>
          <GoalRing pct={pct} />
          <div className="text-center mt-2 space-y-0.5">
            <p className="text-2xl font-bold text-stone-800">
              {todayGoal.wordsWritten.toLocaleString()}
            </p>
            <p className="text-xs text-stone-400">
              of {book.dailyGoal.toLocaleString()} word goal
            </p>
            {book.dailyGoal > todayGoal.wordsWritten && (
              <p className="text-xs text-stone-500 mt-1">
                {(book.dailyGoal - todayGoal.wordsWritten).toLocaleString()} words to go
              </p>
            )}
          </div>
        </div>

        {/* Daily goal setting */}
        <div className="bg-stone-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-600">Daily Target</span>
            <button
              onClick={() => { setGoalInput(String(book.dailyGoal)); setEditGoal(!editGoal); }}
              className="text-xs text-indigo-600 hover:underline"
            >
              {editGoal ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editGoal ? (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                className="flex-1 border border-stone-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                onClick={handleSaveGoal}
                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 1500, 2000].map((n) => (
                <button
                  key={n}
                  onClick={() => setDailyGoal(n)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    book.dailyGoal === n
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-stone-300 text-stone-600 hover:border-indigo-400 hover:text-indigo-600'
                  }`}
                >
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-stone-800">{totalWords.toLocaleString()}</p>
            <p className="text-xs text-stone-400 mt-0.5">Total words</p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-stone-800">{streakDays}</p>
            <p className="text-xs text-stone-400 mt-0.5">
              {streakDays === 1 ? 'Day streak' : 'Day streak'} 🔥
            </p>
          </div>
        </div>

        {/* History */}
        {last7.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} /> Last 7 Days
            </h3>
            <div className="space-y-2">
              {last7.map((g) => (
                <HistoryBar key={g.date} goal={g} />
              ))}
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
