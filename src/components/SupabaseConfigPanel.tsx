import React, { useState, useEffect } from 'react';
import { getSavedCredentials, saveCredentials, clearCredentials, testConnection, seedQuestionsTable } from '../supabaseClient';
import { Database, HelpCircle, CheckCircle2, AlertTriangle, Key, Server, RefreshCw, Sparkles, Code, ChevronDown, ChevronUp } from 'lucide-react';

interface SupabaseConfigPanelProps {
  onConnectionChange: () => void;
  isDarkMode?: boolean;
}

export default function SupabaseConfigPanel({ onConnectionChange, isDarkMode = true }: SupabaseConfigPanelProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string; rowCount?: number } | null>(null);
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const creds = getSavedCredentials();
    setUrl(creds.url);
    setAnonKey(creds.anonKey);
    checkCurrentConnection();
  }, []);

  const checkCurrentConnection = async () => {
    setIsTesting(true);
    const res = await testConnection();
    setStatus(res);
    setIsTesting(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveCredentials(url.trim(), anonKey.trim());
    onConnectionChange();
    await checkCurrentConnection();
  };

  const handleClear = async () => {
    clearCredentials();
    setUrl('');
    setAnonKey('');
    onConnectionChange();
    setStatus(null);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const result = await seedQuestionsTable();
    if (result.success) {
      setStatus({
        success: true,
        message: result.message,
        rowCount: result.rowsInserted
      });
    } else {
      setStatus({
        success: false,
        message: result.message
      });
    }
    setIsSeeding(false);
    onConnectionChange();
  };

  return (
    <div className={`border rounded-2xl select-none transition-all duration-300 ${isOpen ? 'p-6' : 'p-4'} ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100 neon-border-cyan' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
      <div 
        className={`flex items-center justify-between cursor-pointer group select-none ${isOpen ? `mb-4 border-b pb-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-150'}` : 'pb-0 mb-0 border-b-transparent'}`} 
        id="panel-header"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Collapse Database Settings' : 'Expand Database Settings'}
      >
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-neon group-hover:scale-110 transition-transform duration-300" />
          <h2 className="font-outfit font-bold text-lg tracking-wide uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-neon via-cyan-400 to-purple-400">
            Database Settings
          </h2>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              setIsTesting(true);
              const res = await testConnection();
              setStatus(res);
              setIsTesting(false);
              onConnectionChange();
            }}
            disabled={isTesting}
            title="Sync / Refresh Connection and Categories"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer ${
              status?.success 
                ? (isDarkMode ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/40' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100')
                : (isDarkMode ? 'border-rose-500/20 bg-rose-950/20 text-rose-400 hover:border-rose-500/50 hover:bg-rose-950/40' : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100')
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${status?.success ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span>{status?.success ? 'ONLINE' : 'OFFLINE'}</span>
            <RefreshCw className={`w-3 h-3 ml-0.5 ${isTesting ? 'animate-spin' : ''}`} />
          </button>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`p-1.5 rounded-xl cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} transition-all`}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="pt-2 animate-[fadeIn_0.2s_ease-out]">
          <form onSubmit={handleSave} className="space-y-4" id="supabase-config-form">
            <div className="space-y-1">
              <label className={`text-xs font-mono tracking-wide flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Server className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                SUPABASE URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-neon duration-200 font-mono text-xs ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-250 text-slate-800'}`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-mono tracking-wide flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Key className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                SUPABASE ANON KEY
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-neon duration-200 font-mono text-xs ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-250 text-slate-800'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="submit"
                disabled={isTesting || !url || !anonKey}
                className="w-full h-10 bg-cyan-neon/10 hover:bg-cyan-neon/20 border border-cyan-400/30 font-outfit text-xs font-bold tracking-wider text-cyan-neon rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                CONNECT
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!url && !anonKey}
                className={`w-full h-10 border font-outfit text-xs font-bold tracking-wider rounded-xl cursor-pointer transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed ${isDarkMode ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'}`}
              >
                DISCONNECT
              </button>
            </div>
          </form>

          {/* Connection Status Log details */}
          {status && (
            <div className={`mt-4 p-3.5 rounded-xl border flex gap-2.5 text-xs ${status.success ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-500/20 text-slate-200' : 'bg-emerald-50 border-emerald-250 text-emerald-800') : (isDarkMode ? 'bg-rose-950/30 border-rose-500/20 text-slate-200' : 'bg-rose-50 border-rose-250 text-rose-800')}`}>
              {status.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <div className="space-y-1">
                <p className="font-medium">{status.message}</p>
                {status.success && status.rowCount !== undefined && (
                  <p className="text-[11px] font-mono text-emerald-400">
                    Found {status.rowCount} trivia rows in target.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Interactive Seeding actions */}
          {status?.success && (
            <div className={`mt-4 pt-4 border-t space-y-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-150'}`} id="database-actions">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Got no questions in table?</span>
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-neon to-purple-600 font-outfit text-[11px] font-bold text-white tracking-widest uppercase rounded-lg hover:scale-[1.03] active:scale-[0.98] duration-200 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  {isSeeding ? 'SEEDING...' : 'SEED CAR DECKS'}
                </button>
              </div>
            </div>
          )}

          {/* SQL Setup Instruction Assist */}
          <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-150'}`}>
            <button
              type="button"
              onClick={() => setShowSqlHelp(!showSqlHelp)}
              className={`w-full text-left text-xs font-mono flex items-center justify-between focus:outline-none ${isDarkMode ? 'text-slate-400 hover:text-cyan-neon' : 'text-slate-500 hover:text-cyan-600'}`}
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <Code className="w-3.5 h-3.5 text-purple-400" />
                Supabase SQL Setup Code
              </span>
              <span className="text-slate-500">{showSqlHelp ? '[-]' : '[+]'}</span>
            </button>
            {showSqlHelp && (
              <div className={`mt-2.5 rounded-xl p-3 border text-[11px] font-mono overflow-x-auto space-y-2 max-h-48 overflow-y-auto ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <p className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}>Create target table in Supabase SQL Editor:</p>
                <pre className={`font-mono text-[10px] p-2 rounded leading-relaxed border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
{`-- Create SQL questions table with MCQ support
create table questions (
  id bigint generated always as identity primary key,
  category text not null,
  "Questions" text not null,
  answer text not null,
  options jsonb -- holds multiple-choice options array, e.g. ["Choice A", "Choice B", "Choice C", "Choice D"]
);

-- Enable select and insert access for all users
alter table questions enable row level security;

create policy "Allow public read access" 
on questions for select 
using (true);

create policy "Allow public insert access"
on questions for insert
with check (true);
`}
                </pre>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Once created, click <strong>"SEED CAR DECKS"</strong> to instantly populate your clock countdown discussions into your cloud database!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
