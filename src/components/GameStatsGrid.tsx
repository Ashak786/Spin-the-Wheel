import React from 'react';
import { GameStats } from '../types';
import { RotateCcw } from 'lucide-react';
import { isCategoryMatch } from '../supabaseClient';

interface GameStatsGridProps {
  stats: GameStats;
  onResetStats: () => void;
  isDarkMode?: boolean;
  wheelCategories: string[];
}

export default function GameStatsGrid({ stats, onResetStats, isDarkMode = true, wheelCategories }: GameStatsGridProps) {
  // Compute counts for each dynamic category from database/wheel state
  const cat1Name = wheelCategories[0] || 'EV Car Facts';
  const cat2Name = wheelCategories[1] || 'Car Lease';
  const cat3Name = wheelCategories[2] || 'Car Quiz';

  const cat1Count = stats.answeredQuestions.filter((q) => isCategoryMatch(q.category || '', cat1Name)).length;
  const cat2Count = stats.answeredQuestions.filter((q) => isCategoryMatch(q.category || '', cat2Name)).length;
  const cat3Count = stats.answeredQuestions.filter((q) => isCategoryMatch(q.category || '', cat3Name)).length;
  const totalCount = stats.answeredQuestions.length;

  const formatStatsLabel = (label: string): string => {
    if (!label) return '';
    const cleaned = label.toUpperCase().trim();
    if (cleaned === 'FACTS ON EV CAR') return 'EV FACTS';
    if (cleaned === 'CAR LEASE TRIVIA') return 'LEASE TRIVIA';
    if (cleaned.length > 14) {
      return cleaned.slice(0, 11) + '...';
    }
    return cleaned;
  };

  return (
    <div className="space-y-4 select-none">
      {/* Categories and Total Counters Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Category 1 */}
        <div className={`border rounded-xl p-3 flex flex-col justify-between shadow-lg ${isDarkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] font-mono tracking-wider text-pink-400 block uppercase font-bold" title={cat1Name}>
            {formatStatsLabel(cat1Name)}
          </span>
          <div className={`flex items-baseline justify-between mt-2 pt-1 border-t ${isDarkMode ? 'border-slate-800/40' : 'border-slate-100'}`}>
            <span className="text-[10px] text-slate-500 font-mono">Count</span>
            <span className="font-outfit font-black text-xl text-pink-400">
              {cat1Count}
            </span>
          </div>
        </div>

        {/* Category 2 */}
        <div className={`border rounded-xl p-3 flex flex-col justify-between shadow-lg ${isDarkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] font-mono tracking-wider text-cyan-400 block uppercase font-bold" title={cat2Name}>
            {formatStatsLabel(cat2Name)}
          </span>
          <div className={`flex items-baseline justify-between mt-2 pt-1 border-t ${isDarkMode ? 'border-slate-800/40' : 'border-slate-100'}`}>
            <span className="text-[10px] text-slate-500 font-mono">Count</span>
            <span className="font-outfit font-black text-xl text-cyan-400">
              {cat2Count}
            </span>
          </div>
        </div>

        {/* Category 3 */}
        <div className={`border rounded-xl p-3 flex flex-col justify-between shadow-lg ${isDarkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] font-mono tracking-wider text-yellow-500 block uppercase font-bold" title={cat3Name}>
            {formatStatsLabel(cat3Name)}
          </span>
          <div className={`flex items-baseline justify-between mt-2 pt-1 border-t ${isDarkMode ? 'border-slate-800/40' : 'border-slate-100'}`}>
            <span className="text-[10px] text-slate-500 font-mono">Count</span>
            <span className="font-outfit font-black text-xl text-yellow-500">
              {cat3Count}
            </span>
          </div>
        </div>

        {/* Total After the 3 Categories */}
        <div className={`border rounded-xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden h-full ${isDarkMode ? 'bg-slate-900 border-purple-500/40 bg-gradient-to-br from-purple-950/10 to-transparent' : 'bg-gradient-to-br from-purple-50/50 to-white border-purple-200'}`}>
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-full blur-md pointer-events-none" />
          <span className="text-[10px] font-mono tracking-wider text-purple-400 block uppercase font-extrabold flex items-center justify-between">
            <span>Total Displayed</span>
          </span>
          <div className={`flex items-baseline justify-between mt-2 pt-1 border-t ${isDarkMode ? 'border-purple-500/10' : 'border-purple-200/50'}`}>
            <span className="text-[10px] text-slate-500 font-mono">Grand Total</span>
            <span className="font-outfit font-black text-xl text-purple-400">
              {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Sleek inline reset button below the insight indicators */}
      {totalCount > 0 && (
        <div className="flex justify-center pt-1" id="reset-button-container">
          <button
            type="button"
            id="reset-stats-btn"
            onClick={onResetStats}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono tracking-wider font-extrabold transition-all duration-300 active:scale-95 cursor-pointer ${isDarkMode ? 'text-purple-400 hover:text-white bg-slate-950/80 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/50 shadow-md hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]' : 'text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 shadow-sm hover:shadow-md'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET COUNTS
          </button>
        </div>
      )}
    </div>
  );
}
