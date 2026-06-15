import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { liveAudio } from '../utils/audio';
import { Clock, HelpCircle, X, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface ActiveQuestionModalProps {
  question: Question | null;
  isLoading: boolean;
  onAnswerSubmitted: (isCorrect: boolean) => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function ActiveQuestionModal({
  question,
  isLoading,
  onAnswerSubmitted,
  onClose,
  isDarkMode = true,
}: ActiveQuestionModalProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Restart states when a new question arrives
  useEffect(() => {
    if (question) {
      setTimeLeft(60);
      setSelectedOption(null);
      setHasSubmitted(false);
      setIsCorrect(false);
    }
  }, [question]);

  // Handle the active counting down timer (60 seconds)
  useEffect(() => {
    if (!question || isLoading) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          liveAudio.playWarningTick();
          
          // Auto incorrect if not selected
          setHasSubmitted(true);
          setIsCorrect(false);
          liveAudio.playFailure();
          return 0;
        }

        // Ticking audio triggers
        if (prev <= 6) {
          liveAudio.playWarningTick();
        } else {
          liveAudio.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, isLoading]);

  const handleOptionSelect = (option: string) => {
    if (hasSubmitted || timeLeft === 0) return;

    // Halt timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSelectedOption(option);
    setHasSubmitted(true);

    const correct = option.trim().toLowerCase() === question?.answer?.trim().toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      liveAudio.playSuccess();
    } else {
      liveAudio.playFailure();
    }
  };

  const handleClose = () => {
    liveAudio.playClick();
    onAnswerSubmitted(isCorrect);
    onClose();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div className={`flex flex-col items-center gap-3 p-8 border rounded-2xl select-none ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} id="loader-box">
          <span className="w-10 h-10 border-4 border-pink-neon border-t-transparent rounded-full animate-spin shrink-0" />
          <p className={`font-outfit font-medium tracking-wider uppercase text-sm animate-pulse ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Fetching Question...
          </p>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const isMyth = question.category === 'Facts on EV Car';
  const isPrice = question.category === 'Car Lease Trivia';

  const categoryTheme = isMyth 
    ? { border: 'border-pink-neon', glow: 'neon-border-pink', text: 'text-pink-neon', bg: 'from-pink-950/10 to-transparent' }
    : isPrice
    ? { border: 'border-cyan-neon', glow: 'neon-border-cyan', text: 'text-cyan-neon', bg: 'from-cyan-950/10 to-transparent' }
    : { border: 'border-yellow-neon', glow: 'neon-border-yellow', text: 'text-yellow-neon', bg: 'from-yellow-950/10 to-transparent' };

  const options = question.options || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/85 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`w-full max-w-[96%] sm:max-w-[92vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl border ${categoryTheme.border} ${isDarkMode ? `${categoryTheme.glow} bg-slate-900 text-slate-100` : 'bg-white text-slate-800 shadow-2xl'} rounded-3xl overflow-hidden relative shadow-2xl p-6 sm:p-8 md:p-10 select-none`}
        id="question-modal-container"
      >
        {/* Top Close (X) button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-200 cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          aria-label="Close"
          id="modal-close-x-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title / Countdown Header */}
        <div className={`flex items-center justify-between gap-4 mb-5 pb-3 border-b pr-10 ${isDarkMode ? 'border-slate-800/80' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-[10px] font-mono font-extrabold uppercase tracking-widest rounded border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-250'} ${categoryTheme.text}`}>
              {question.category}
            </span>
            {question.source === 'supabase' ? (
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                ⚡ DB LIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-slate-500/10 border border-slate-500/20 text-slate-400">
                LOCAL DECK
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`} />
            <span className={`font-mono font-bold text-sm tracking-wide ${timeLeft <= 10 ? 'text-rose-500 font-extrabold scale-110' : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Visual Animated Time ProgressBar */}
        <div className={`w-full h-1.5 rounded-full mb-6 overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 60) * 100}%` }}
            transition={{ ease: 'linear', duration: 1 }}
            className={`h-full bg-gradient-to-r ${timeLeft <= 10 ? 'from-rose-600 to-red-500' : isMyth ? 'from-pink-neon to-purple-600' : isPrice ? 'from-cyan-neon to-sky-600' : 'from-yellow-neon to-amber-500'}`}
          />
        </div>

        {/* The Core Question Segment */}
        <div className={`text-center py-7 px-5 space-y-4 rounded-3xl bg-gradient-to-b ${categoryTheme.bg} border ${isDarkMode ? 'border-slate-800/50' : 'border-slate-150 shadow-inner'}`}>
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center border ${isDarkMode ? 'bg-slate-950/85 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <HelpCircle className={`w-6 h-6 ${categoryTheme.text} animate-bounce`} />
          </div>
          
          <div className="space-y-2">
            <span className={`text-[10px] font-mono uppercase tracking-widest block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              TRIVIA QUESTION
            </span>
            <h3 className={`font-sans text-base sm:text-lg md:text-xl font-extrabold tracking-tight leading-relaxed ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {question.question_text}
            </h3>
          </div>
        </div>

        {/* Multiple Choice Options List */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] md:max-h-[55vh] overflow-y-auto pr-1">
          {options.map((option, index) => {
            const isSelected = selectedOption === option;
            const isCorrectAnswer = option.trim().toLowerCase() === question.answer?.trim().toLowerCase();
            
            let btnStyle = "";
            let textStyle = "";
            let optionBadgeStyle = "";
            let icon = null;

            if (!hasSubmitted) {
              btnStyle = isDarkMode
                ? "bg-slate-950/60 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700 active:scale-[0.99] cursor-pointer"
                : "bg-slate-50 hover:bg-slate-100/95 border-slate-200 active:scale-[0.99] cursor-pointer";
              textStyle = isDarkMode ? "text-slate-350 hover:text-white" : "text-slate-700";
              optionBadgeStyle = isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-250 text-slate-500";
            } else {
              if (isCorrectAnswer) {
                btnStyle = isDarkMode
                  ? "bg-emerald-950/35 border-emerald-500/70 text-emerald-100 shadow-sm"
                  : "bg-emerald-50/80 border-emerald-400 text-emerald-900 shadow-sm";
                textStyle = "font-bold text-emerald-500";
                optionBadgeStyle = "bg-emerald-500 border-emerald-400 text-white";
                icon = <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3] mt-1" />;
              } else if (isSelected) {
                btnStyle = isDarkMode
                  ? "bg-rose-950/30 border-rose-500/60 text-slate-300"
                  : "bg-rose-50 border-rose-450 text-rose-950";
                textStyle = "line-through text-rose-500 font-medium";
                optionBadgeStyle = "bg-rose-500 border-rose-450 text-white";
                icon = <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[3] mt-1" />;
              } else {
                btnStyle = isDarkMode
                  ? "bg-slate-950/15 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed"
                  : "bg-slate-100/50 border-slate-150 text-slate-400 opacity-55 cursor-not-allowed";
                textStyle = isDarkMode ? "text-slate-550" : "text-slate-400";
                optionBadgeStyle = isDarkMode ? "bg-slate-950 border-slate-900 text-slate-700" : "bg-slate-50 border-slate-200 text-slate-300";
              }
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(option)}
                disabled={hasSubmitted}
                className={`w-full text-left px-5 py-4 rounded-2xl border flex items-start justify-between gap-3.5 transition-all duration-200 ${btnStyle}`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <span className={`w-7 h-7 rounded-xl text-xs font-mono flex items-center justify-center font-bold border shrink-0 transition-all mt-0.5 ${optionBadgeStyle}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`font-sans text-xs sm:text-sm leading-relaxed whitespace-normal break-words py-0.5 ${textStyle}`} title={option}>
                    {option}
                  </span>
                </div>
                {icon}
              </button>
            );
          })}
        </div>

        {/* Custom Out-of-Time Alert */}
        {timeLeft === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-amber-950/25 border border-amber-500/30 rounded-xl text-center text-amber-400 text-xs font-mono uppercase tracking-wider"
          >
            ⏰ Time is up! Correct answer: <strong className="text-emerald-400">{question.answer}</strong>
          </motion.div>
        )}

        {/* Action Button Segment */}
        <div className="mt-6">
          <button
            type="button"
            disabled={!hasSubmitted}
            onClick={handleClose}
            className={`w-full h-12 ${
              !hasSubmitted
                ? (isDarkMode ? 'bg-slate-800 text-slate-500 border border-slate-705/30 cursor-not-allowed opacity-50' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60')
                : `bg-gradient-to-r ${
                    isMyth 
                      ? 'from-pink-neon to-purple-600 font-black text-slate-950' 
                      : isPrice 
                      ? 'from-cyan-neon to-sky-600 font-black text-slate-950' 
                      : 'from-yellow-neon to-amber-500 font-black text-slate-950'
                  } hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-black/40`
            } font-outfit text-xs tracking-widest uppercase rounded-xl duration-200 flex items-center justify-center gap-2`}
            id="modal-done-btn"
          >
            {hasSubmitted ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                {isCorrect ? 'CORRECT! CONTINUE' : 'CONTINUE'}
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 animate-pulse text-current" />
                CHOOSE AN ANSWER
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
