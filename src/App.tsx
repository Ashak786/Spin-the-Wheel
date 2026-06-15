import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getSupabaseClient, 
  fetchRandomQuestionFromCategory, 
  testConnection,
  fetchDatabaseCategories
} from './supabaseClient';
import { Question, GameStats } from './types';
import { liveAudio } from './utils/audio';

// Custom component imports
import SupabaseConfigPanel from './components/SupabaseConfigPanel';
import ActiveQuestionModal from './components/ActiveQuestionModal';
import GameStatsGrid from './components/GameStatsGrid';

// SVG Assets
import { Volume2, VolumeX, Sparkles, HelpCircle, AlertTriangle, Zap, RefreshCw, Trophy, Sun, Moon } from 'lucide-react';

const STATS_STORAGE_KEY = 'spin_wheel_game_stats';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('spin_wheel_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelCategories, setWheelCategories] = useState<string[]>([
    'Facts on EV Car',
    'Car Lease Trivia',
    'Car Quiz'
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dbStatus, setDbStatus] = useState({ isConnected: false, rowCount: 0 });
  const [isSyncing, setIsSyncing] = useState(false);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    correctAnswers: 0,
    totalSpins: 0,
    answeredQuestions: []
  });

  // Read saved statistics & DB connection state on launch
  useEffect(() => {
    liveAudio.enabled = soundEnabled;
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      try {
        setStats(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed parsing historical score statistics', e);
      }
    }
    verifyDatabase();
  }, []);

  // Sync dark mode style attribute or preference
  useEffect(() => {
    localStorage.setItem('spin_wheel_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const verifyDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await testConnection();
      setDbStatus({
        isConnected: res.success,
        rowCount: res.rowCount || 0
      });

      if (res.success) {
        const cats = await fetchDatabaseCategories();
        if (cats.length > 0) {
          // Pad to exactly 3 segments if the user database is small
          const paddedCats = [...cats];
          while (paddedCats.length < 3) {
            paddedCats.push(paddedCats[paddedCats.length - 1] || 'DB Trivia');
          }
          setWheelCategories(paddedCats.slice(0, 3));
        } else {
          setWheelCategories([
            'DB Category 1',
            'DB Category 2',
            'DB Category 3'
          ]);
        }
      } else {
        setWheelCategories([
          'Facts on EV Car',
          'Car Lease Trivia',
          'Car Quiz'
        ]);
      }
    } catch (e) {
      console.warn('verifyDatabase failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveStats = (newStats: GameStats) => {
    setStats(newStats);
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
  };

  const handleSoundToggle = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    liveAudio.enabled = nextVal;
    liveAudio.playClick();
  };

  const handleResetStats = () => {
    const reset: GameStats = {
      score: 0,
      streak: 0,
      correctAnswers: 0,
      totalSpins: 0,
      answeredQuestions: []
    };
    saveStats(reset);
    liveAudio.playClick();
  };

  const formatLabel = (label: string): string => {
    if (!label) return '';
    const cleaned = label.toUpperCase().trim();
    if (cleaned === 'FACTS ON EV CAR') return 'EV CAR FACTS';
    if (cleaned === 'CAR LEASE TRIVIA') return 'CAR LEASE';
    if (cleaned.length > 16) {
      return cleaned.slice(0, 13) + '...';
    }
    return cleaned;
  };

  // Determine category under pointer from global rotation angle
  const getCategoryFromAngle = (rotationVal: number): string => {
    let normalizedRotation = rotationVal % 360;
    if (normalizedRotation < 0) {
      normalizedRotation += 360;
    }
    // Pointer is straight pointing UP (12 o'clock, which in SVG circles is at angle 270)
    const wheelRelativeAngle = (270 - normalizedRotation + 360 * 10) % 360;

    if (wheelRelativeAngle >= 300 || wheelRelativeAngle < 60) {
      return wheelCategories[0] || 'Facts on EV Car';
    } else if (wheelRelativeAngle >= 60 && wheelRelativeAngle < 180) {
      return wheelCategories[1] || 'Car Lease Trivia';
    } else {
      return wheelCategories[2] || 'Car Quiz';
    }
  };

  const handleSpinClick = () => {
    if (isSpinning) return;
    
    // Clear out residual state
    setActiveQuestion(null);
    setSelectedCategory(null);
    setIsSpinning(true);
    
    // Select spin direction at random: clockwise or anti-clockwise
    const isClockwise = Math.random() > 0.5;
    
    // Generate spinning torque values (5 to 8 complete revolutions + random angle)
    const extraTurns = 5 + Math.floor(Math.random() * 4);
    const addedDegrees = extraTurns * 360 + Math.floor(Math.random() * 360);
    const finalAddedDegrees = isClockwise ? addedDegrees : -addedDegrees;
    const newRotation = rotation + finalAddedDegrees;
    
    // Play synthetic whirring sweep
    liveAudio.playSpin(3200);
    setRotation(newRotation);
  };

  const handleSpinAnimationComplete = async () => {
    if (!isSpinning) return;
    setIsSpinning(false);
    
    // Compute targeted category
    const category = getCategoryFromAngle(rotation);
    setSelectedCategory(category);
    
    // Standard chime
    liveAudio.playClick();

    // Show landing segment for exactly 1 second (1000ms) before opening the question modal
    setTimeout(async () => {
      setIsLoadingQuestion(true);
      setShowQuestionModal(true);

      // List of completed IDs to secure uniqueness
      const answeredIds = stats.answeredQuestions.map(q => q.questionId);

      try {
        // Fetch matching row
        const result = await fetchRandomQuestionFromCategory(category, answeredIds);
        
        // Let standard visual effect settle down
        setTimeout(() => {
          setActiveQuestion(result.question);
          setIsLoadingQuestion(false);
        }, 500);
      } catch (e) {
        console.error('Fetch question trigger failed', e);
        setIsLoadingQuestion(false);
        setShowQuestionModal(false);
      }
    }, 1000);
  };

  const handleAnswerOutcome = (isCorrect: boolean) => {
    if (!activeQuestion) return;

    const basePoints = 100;
    const streakBonus = stats.streak * 20;
    const gainedScore = isCorrect ? (basePoints + streakBonus) : 0;
    const nextStreak = isCorrect ? stats.streak + 1 : 0;

    const updatedRound = {
      questionId: activeQuestion.id,
      category: activeQuestion.category,
      isCorrect,
      timestamp: Date.now()
    };

    const newStats: GameStats = {
      score: stats.score + gainedScore,
      streak: nextStreak,
      correctAnswers: isCorrect ? stats.correctAnswers + 1 : stats.correctAnswers,
      totalSpins: stats.totalSpins + 1,
      answeredQuestions: [...stats.answeredQuestions, updatedRound]
    };

    saveStats(newStats);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans selection:bg-pink-neon selection:text-white pb-12`}>
      {/* HEADER SECTION */}
      <header className={`border-b ${isDarkMode ? 'border-slate-900 bg-slate-950/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md sticky top-0 z-40 select-none`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-neon to-purple-600 flex items-center justify-center border border-pink-400/40">
              <Sparkles className="w-5 h-5 text-yellow-neon animate-pulse" />
            </div>
            <div>
              <h1 className="font-outfit font-black text-xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-neon via-purple-400 to-cyan-neon leading-none">
                SPIN THE WHEEL
              </h1>
              <span className={`text-[10px] font-mono tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} block uppercase pt-0.5`}>
                Motor Trivia Arena
              </span>
            </div>
          </div>

          {/* Interactive Toggle Settings */}
          <div className="flex items-center gap-3">
            {/* Light / Dark Mode Toggle button */}
            <button
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                liveAudio.playClick();
              }}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${isDarkMode ? 'border-amber-500/20 bg-amber-950/20 text-yellow-400 hover:bg-amber-950/40' : 'border-slate-350 bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="theme-mode-toggle-btn"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Audio Toggle button */}
            <button
              onClick={handleSoundToggle}
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${soundEnabled ? (isDarkMode ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40' : 'border-emerald-500/30 bg-emerald-50 text-emerald-650 hover:bg-emerald-100/60') : (isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700' : 'border-slate-300 bg-slate-100 text-slate-400 hover:border-slate-200')}`}
              title={soundEnabled ? 'Mute Game Sounds' : 'Unmute Game Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Supabase Status Chip - Interactive Action */}
            <button
              onClick={async () => {
                if (isSyncing) return;
                liveAudio.playClick();
                await verifyDatabase();
              }}
              disabled={isSyncing}
              title="Click to sync/refresh dynamic rows & categories from Supabase"
              className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${dbStatus.isConnected ? (isDarkMode ? 'border-emerald-500/30 bg-emerald-950/25 text-emerald-400 hover:border-emerald-400/60 hover:bg-emerald-950/40' : 'border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100/60 text-emerald-700') : (isDarkMode ? 'border-slate-800 bg-slate-900/45 text-slate-400 hover:border-slate-700 hover:bg-slate-900' : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200/60')}`}
            >
              <span className={`w-2 h-2 rounded-full ${dbStatus.isConnected ? 'bg-emerald-400' : 'bg-rose-500'} ${isSyncing ? 'animate-ping' : 'animate-pulse'}`} />
              {isSyncing ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  SYNCING...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {dbStatus.isConnected ? `CLOUD DB ONLINE (${dbStatus.rowCount})` : 'PLAYING LOCAL DECK'}
                  <RefreshCw className="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity" />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CORE GRID LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Supabase Settings & Live Stats Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Welcome Card Info */}
          <section className={`border rounded-2xl p-6 relative overflow-hidden flex flex-col gap-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
            <div className="absolute right-[-15px] top-[-15px] w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-xl pointer-events-none" />
            <h2 className={`font-outfit font-extrabold text-lg uppercase tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              <Zap className="w-5 h-5 text-yellow-neon animate-pulse" />
              CISCO Wellbeing!
            </h2>
            <p className={`text-xs leading-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Put your piston knowledge to the ultimate high-speed test. Spin the colorful wheel to pick a car trivia category. Answer questions correctly before the <strong>60-second timer</strong> ticks to zero to inflate your score combo multipliers!
            </p>
            

          </section>

          {/* Connection GUI config */}
          <section>
            <SupabaseConfigPanel onConnectionChange={verifyDatabase} isDarkMode={isDarkMode} />
          </section>

          {/* Telemetry metrics dashboard */}
          <section>
            <GameStatsGrid stats={stats} onResetStats={handleResetStats} isDarkMode={isDarkMode} wheelCategories={wheelCategories} />
          </section>
        </div>

        {/* RIGHT COLUMN: The Magnificent Spinning Wheel Area */}
        <div className={`lg:col-span-7 flex flex-col items-center justify-center py-6 lg:py-12 border rounded-3xl p-8 relative min-h-[500px] ${isDarkMode ? 'bg-slate-900/35 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`} id="wheel-arena">
          <div className={`absolute top-4 left-4 flex gap-1.5 text-[10px] font-mono uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>pointer position: 12 o'clock</span>
          </div>

          {/* Neon Pointer Arrow peg */}
          <div className="relative flex flex-col items-center z-10 select-none">
            {/* Pointer Peg pointer SVG */}
            <div className="absolute top-[-26px] z-20" id="wheel-pointer">
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="drop-shadow-[0_4px_10px_rgba(255,0,127,0.7)]">
                <path d="M17 34L3.14359 10L30.8564 10L17 34Z" fill="#ff007f" />
                <path d="M17 28L7.47372 11.5L26.5263 11.5L17 28Z" fill="#fffb00" />
              </svg>
            </div>
            
            {/* The physical glowing Wheel wheel frame */}
            <div className="rounded-full bg-slate-950 p-4 border-4 border-slate-800 shadow-2xl relative">
              
              {/* Spinning wheel SVG via motion wrapper */}
              <motion.div
                id="spinning-wheel-rotator"
                initial={false}
                animate={{ rotate: rotation }}
                onAnimationComplete={handleSpinAnimationComplete}
                transition={{
                  type: 'tween',
                  ease: [0.1, 0.8, 0.15, 1], // Perfect slow-down curves matching real momentum
                  duration: 3.2
                }}
                className="w-72 h-72 sm:w-96 sm:h-96"
              >
                <svg
                  viewBox="0 0 360 360"
                  className="w-full h-full transform drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]"
                >
                  {/* Base Circle shadow */}
                  <circle cx="180" cy="180" r="175" fill="#020617" />

                  {/* Segment Groups rotated dynamically */}
                  
                  {/* SEGMENT 1: Dynamic Category 1 */}
                  <g transform="rotate(0, 180, 180)">
                    <path
                      d="M 180 180 L 265 32.8 A 170 170 0 0 1 265 327.2 Z"
                      fill="#ff007f"
                      stroke="#020617"
                      strokeWidth="5"
                      className="cursor-pointer hover:opacity-90 duration-150"
                    />
                    {/* Radially Rotated and Centered Label */}
                    <text
                      x="285"
                      y="180"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      className="font-outfit font-black text-[10px] sm:text-[11px] tracking-wider uppercase select-none pointer-events-none fill-white drop-shadow-md"
                    >
                      {formatLabel(wheelCategories[0])}
                    </text>
                  </g>
 
                  {/* SEGMENT 2: Dynamic Category 2 */}
                  <g transform="rotate(120, 180, 180)">
                    <path
                      d="M 180 180 L 265 32.8 A 170 170 0 0 1 265 327.2 Z"
                      fill="#00f0ff"
                      stroke="#020617"
                      strokeWidth="5"
                      className="cursor-pointer hover:opacity-90 duration-150"
                    />
                    {/* Radially Rotated and Centered Label */}
                    <text
                      x="285"
                      y="180"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#020617"
                      className="font-outfit font-black text-[10px] sm:text-[11px] tracking-wider uppercase select-none pointer-events-none fill-slate-950"
                    >
                      {formatLabel(wheelCategories[1])}
                    </text>
                  </g>
 
                  {/* SEGMENT 3: Dynamic Category 3 */}
                  <g transform="rotate(240, 180, 180)">
                    <path
                      d="M 180 180 L 265 32.8 A 170 170 0 0 1 265 327.2 Z"
                      fill="#fffb00"
                      stroke="#020617"
                      strokeWidth="5"
                      className="cursor-pointer hover:opacity-90 duration-150"
                    />
                    {/* Radially Rotated and Centered Label */}
                    <text
                      x="285"
                      y="180"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#020617"
                      className="font-outfit font-black text-[10px] sm:text-[11px] tracking-wider uppercase select-none pointer-events-none fill-slate-950"
                    >
                      {formatLabel(wheelCategories[2])}
                    </text>
                  </g>
 
                  {/* Outer mechanical lightbulbs decoration rim */}
                  <circle cx="180" cy="180" r="172" fill="none" stroke="#0f172a" strokeWidth="6" strokeDasharray="18 10" />
                  <circle cx="180" cy="180" r="172" fill="none" stroke="#ff007f" strokeWidth="3" strokeDasharray="4 24" className="animate-pulse" />
                  <circle cx="180" cy="180" r="172" fill="none" stroke="#00f0ff" strokeWidth="3" strokeDasharray="12 16" className="animate-pulse-slow" />
                </svg>
              </motion.div>
 
              {/* Central spinning Orb interactive trigger button */}
              <button
                onClick={handleSpinClick}
                disabled={isSpinning}
                id="central-spin-trigger-btn"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950 border-4 border-slate-800 shadow-[0_0_20px_rgba(255,251,0,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center justify-center font-outfit font-black text-white uppercase disabled:opacity-85 disabled:cursor-not-allowed select-none transition-all duration-300 active:scale-95 group"
              >
                <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-pink-neon via-purple-600 to-cyan-neon opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
                <span className={`relative z-10 font-black transition-all duration-200 text-center select-none ${
                  isSpinning 
                    ? 'text-[10px] sm:text-[11px] tracking-wider' 
                    : 'text-xs sm:text-base tracking-widest'
                }`}>
                  {isSpinning ? 'SPINNING' : 'SPIN'}
                </span>
              </button>
            </div>
          </div>
 
          {/* Current Category pointer highlight displayer */}
          <div className="mt-8 text-center min-h-[40px] select-none">
            {selectedCategory ? (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}
              >
                <span className={`w-3 h-3 rounded-full ${selectedCategory === wheelCategories[0] ? 'bg-pink-neon' : selectedCategory === wheelCategories[1] ? 'bg-cyan-neon' : 'bg-yellow-neon'}`} />
                <span className={`font-outfit font-bold uppercase tracking-widest text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  LANDED ON: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedCategory}</strong>
                </span>
              </motion.div>
            ) : (
              <p className={`font-mono text-[11px] tracking-wide animate-pulse uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                PUSH CENTRAL SPIN DRIVE TO SELECT CATEGORY
              </p>
            )}
          </div>
        </div>
      </main>

      {/* OVERLAY / MODAL DIALOGS */}
      <AnimatePresence>
        {showQuestionModal && (
          <ActiveQuestionModal
            question={activeQuestion}
            isLoading={isLoadingQuestion}
            onAnswerSubmitted={handleAnswerOutcome}
            isDarkMode={isDarkMode}
            onClose={() => {
              setShowQuestionModal(false);
              setActiveQuestion(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
