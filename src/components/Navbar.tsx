import React from 'react';
import { Shield, Sparkles, Wifi, WifiOff, Layers, Layers2, BookOpen, Search, Database, HelpCircle } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveTab = 'chat' | 'layers' | 'stack' | 'rules' | 'cards' | 'data';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOnline: boolean;
  manualOffline: boolean;
  toggleManualOffline: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  manualOffline,
  toggleManualOffline,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-indigo-600/20 to-purple-700/20 border border-amber-500/30 shadow-inner">
            <Shield className="w-5 h-5 text-amber-400" />
            <Sparkles className="w-3 h-3 text-indigo-400 absolute -top-1 -right-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wide text-slate-100 flex items-center gap-1.5">
                Judge Gemma
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                L3 Arbiter
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400">
              Magic: The Gathering Comprehensive Rules & Interaction Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>💬</span> Judge Call
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'layers'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Layer Evaluator
          </button>
          <button
            onClick={() => setActiveTab('stack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'stack'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers2 className="w-3.5 h-3.5" /> The Stack
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Rulebook
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Card Oracle
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'data'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Offline DB
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          {/* Online / Offline status toggle */}
          <button
            onClick={toggleManualOffline}
            title={
              isOnline
                ? 'Online Mode (Gemini AI active). Click to test offline mode.'
                : 'Offline Mode (Local Rules Engine active). Click to switch to online.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/60 border-amber-600/50 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Online (AI)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Offline (Rules)</span>
              </>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 bg-slate-900/70 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'chat' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
          }`}
        >
          💬 Judge Call
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'layers' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
          }`}
        >
          🧬 Layers
        </button>
        <button
          onClick={() => setActiveTab('stack')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'stack' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
          }`}
        >
          ⚡ Stack
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'rules' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
          }`}
        >
          📖 Rules
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
          }`}
        >
          🃏 Cards
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap ${
            activeTab === 'data' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
          }`}
        >
          💾 Offline DB
        </button>
      </div>
    </header>
  );
};
