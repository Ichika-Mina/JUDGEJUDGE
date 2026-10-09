import React, { useState } from 'react';
import { Layers2, Play, Plus, RotateCcw, ShieldAlert, ArrowDown, User, Check, X } from 'lucide-react';

interface StackItem {
  id: string;
  name: string;
  type: 'Spell' | 'Triggered Ability' | 'Activated Ability';
  controller: 'Active Player (AP)' | 'Non-Active Player (NAP)';
  target?: string;
  effectText: string;
  timestamp: number;
}

export const StackVisualizer: React.FC = () => {
  const [stack, setStack] = useState<StackItem[]>([
    {
      id: 'spell-1',
      name: 'Wrath of God',
      type: 'Spell',
      controller: 'Active Player (AP)',
      effectText: 'Destroy all creatures. They cannot be regenerated.',
      timestamp: 1,
    },
    {
      id: 'spell-2',
      name: 'Counterspell',
      type: 'Spell',
      controller: 'Non-Active Player (NAP)',
      target: 'Wrath of God',
      effectText: 'Counter target spell.',
      timestamp: 2,
    },
    {
      id: 'spell-3',
      name: 'Fierce Guardianship',
      type: 'Spell',
      controller: 'Active Player (AP)',
      target: 'Counterspell',
      effectText: 'Counter target noncreature spell.',
      timestamp: 3,
    },
  ]);

  const [activePlayerPriority, setActivePlayerPriority] = useState<boolean>(true);
  const [apPassed, setApPassed] = useState<boolean>(false);
  const [napPassed, setNapPassed] = useState<boolean>(false);
  const [resolvedLog, setResolvedLog] = useState<string[]>([
    'Game initialized. Active Player (AP) cast Wrath of God.',
    'NAP responded with Counterspell.',
    'AP responded with Fierce Guardianship.',
  ]);

  // Add Item to Stack
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<StackItem['type']>('Spell');
  const [newController, setNewController] = useState<StackItem['controller']>('Active Player (AP)');
  const [newEffect, setNewEffect] = useState('');

  const handlePushStack = () => {
    if (!newTitle.trim()) return;

    const item: StackItem = {
      id: `item-${Date.now()}`,
      name: newTitle,
      type: newType,
      controller: newController,
      effectText: newEffect || 'Spell / ability resolves.',
      timestamp: stack.length + 1,
    };

    setStack([item, ...stack]); // Top of stack is index 0
    setApPassed(false);
    setNapPassed(false);
    setActivePlayerPriority(newController === 'Active Player (AP)');
    setResolvedLog((prev) => [
      `${newController} added ${newType} "${newTitle}" to the top of the stack (CR 405.1).`,
      ...prev,
    ]);
    setNewTitle('');
    setNewEffect('');
  };

  // Pass Priority
  const handlePassPriority = (player: 'AP' | 'NAP') => {
    if (player === 'AP') {
      setApPassed(true);
      setActivePlayerPriority(false);
      setResolvedLog((prev) => ['Active Player passed priority to Non-Active Player (CR 117.3d).', ...prev]);

      if (napPassed) {
        // Both passed in succession! Resolve top
        resolveTop();
      }
    } else {
      setNapPassed(true);
      setActivePlayerPriority(true);
      setResolvedLog((prev) => ['Non-Active Player passed priority to Active Player (CR 117.3d).', ...prev]);

      if (apPassed) {
        // Both passed in succession! Resolve top
        resolveTop();
      }
    }
  };

  const resolveTop = () => {
    if (stack.length === 0) {
      setResolvedLog((prev) => ['The stack is empty. Step or phase advances (CR 117.4).', ...prev]);
      setApPassed(false);
      setNapPassed(false);
      return;
    }

    const [topItem, ...rest] = stack;
    setStack(rest);
    setApPassed(false);
    setNapPassed(false);
    setActivePlayerPriority(true); // AP gets priority after resolution (CR 117.3b)

    let logMsg = `RESOLVED: "${topItem.name}" (${topItem.type}) controlled by ${topItem.controller} resolved!`;
    if (topItem.target) {
      logMsg += ` (Applied to target: ${topItem.target})`;
    }
    setResolvedLog((prev) => [logMsg, ...prev]);
  };

  // Counter Top Spell
  const counterTop = () => {
    if (stack.length === 0) return;
    const [topItem, ...rest] = stack;
    setStack(rest);
    setApPassed(false);
    setNapPassed(false);
    setActivePlayerPriority(true);
    setResolvedLog((prev) => [
      `COUNTERED: "${topItem.name}" was removed from the stack and put into the graveyard (CR 701.5).`,
      ...prev,
    ]);
  };

  const resetStack = () => {
    setStack([]);
    setApPassed(false);
    setNapPassed(false);
    setActivePlayerPriority(true);
    setResolvedLog(['Stack reset to empty.']);
  };

  // Preset APNAP scenario
  const loadAPNAPPreset = () => {
    setStack([
      {
        id: 'nap-trigger',
        name: "Blood Artist Trigger (NAP)",
        type: 'Triggered Ability',
        controller: 'Non-Active Player (NAP)',
        effectText: 'Target player loses 1 life and you gain 1 life.',
        timestamp: 2,
      },
      {
        id: 'ap-trigger',
        name: "Blood Artist Trigger (AP)",
        type: 'Triggered Ability',
        controller: 'Active Player (AP)',
        effectText: 'Target player loses 1 life and you gain 1 life.',
        timestamp: 1,
      },
    ]);
    setApPassed(false);
    setNapPassed(false);
    setActivePlayerPriority(true);
    setResolvedLog([
      'APNAP TRIGGER ORDER (CR 101.4c): Board wipe occurred. AP put their trigger on stack first, then NAP put their trigger on top. NAP trigger resolves FIRST!',
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers2 className="w-5 h-5 text-amber-400" /> The Stack & Priority Simulator (CR 405 & CR 117)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            LIFO (Last In, First Out) resolution engine with Active Player / Non-Active Player priority passes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAPNAPPreset}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-amber-300 font-medium transition cursor-pointer"
          >
            Load APNAP Trigger Scenario
          </button>
          <button
            onClick={resetStack}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            title="Reset stack"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Priority Bar & State-Based Action Indicator */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <User className="w-4 h-4 text-amber-400" /> Current Priority:
          </span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold ${
              activePlayerPriority
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {activePlayerPriority ? 'Active Player (AP)' : 'Non-Active Player (NAP)'}
          </span>

          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            SBAs Clean (CR 704)
          </span>
        </div>

        {/* Priority pass actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePassPriority('AP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              apPassed
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-600/40'
            }`}
          >
            {apPassed ? '✓ AP Passed' : 'AP Pass Priority'}
          </button>
          <button
            onClick={() => handlePassPriority('NAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              napPassed
                ? 'bg-slate-800 text-slate-500 border-slate-700'
                : 'bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border-indigo-600/40'
            }`}
          >
            {napPassed ? '✓ NAP Passed' : 'NAP Pass Priority'}
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Stack & Resolution Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visual Stack (LIFO: Index 0 is TOP) */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <span>The Stack ({stack.length} Objects)</span>
              <span className="text-xs text-amber-400 font-mono">CR 405</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={resolveTop}
                disabled={stack.length === 0}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" /> Resolve Top Object
              </button>
              <button
                onClick={counterTop}
                disabled={stack.length === 0}
                className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 disabled:opacity-40 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Counter Top
              </button>
            </div>
          </div>

          {stack.length === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-800 text-center text-slate-500 text-xs">
              The stack is empty. Spells and abilities go here when cast or triggered.
            </div>
          ) : (
            <div className="space-y-2.5">
              {stack.map((item, index) => {
                const isTop = index === 0;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition relative ${
                      isTop
                        ? 'bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950/80 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isTop ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="font-bold text-sm text-slate-100">{item.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 pl-7">{item.effectText}</p>
                        {item.target && (
                          <p className="text-[11px] text-amber-400 pl-7 mt-0.5">
                            Target: {item.target}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            item.controller === 'Active Player (AP)'
                              ? 'bg-amber-950/80 text-amber-300'
                              : 'bg-indigo-950/80 text-indigo-300'
                          }`}
                        >
                          {item.controller}
                        </span>
                        {isTop && (
                          <span className="block text-[10px] font-bold text-amber-400 mt-1 uppercase">
                            ▲ Next to resolve
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Add Spell / Ability & Event Log */}
        <div className="space-y-4">
          {/* Add to Stack Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md text-xs space-y-2.5">
            <h4 className="font-bold text-amber-400 flex items-center justify-between">
              <span>Cast Spell / Put Ability on Stack</span>
              <Plus className="w-4 h-4 text-amber-400" />
            </h4>

            <div>
              <label className="text-slate-400 block mb-1">Name</label>
              <input
                type="text"
                placeholder="e.g. Lightning Bolt, Blood Artist Trigger"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                >
                  <option value="Spell">Spell (CR 601)</option>
                  <option value="Triggered Ability">Triggered Ability (CR 603)</option>
                  <option value="Activated Ability">Activated Ability (CR 602)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Controller</label>
                <select
                  value={newController}
                  onChange={(e) => setNewController(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
                >
                  <option value="Active Player (AP)">Active Player (AP)</option>
                  <option value="Non-Active Player (NAP)">Non-Active Player (NAP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Effect / Target</label>
              <input
                type="text"
                placeholder="e.g. Deals 3 damage to any target"
                value={newEffect}
                onChange={(e) => setNewEffect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
              />
            </div>

            <button
              onClick={handlePushStack}
              className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer"
            >
              Push Onto Stack (Top)
            </button>
          </div>

          {/* Chronological Action & Resolution Log */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Priority & Resolution Audit Log
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] text-slate-400 font-mono pr-1">
              {resolvedLog.map((log, idx) => (
                <div key={idx} className="pb-1 border-b border-slate-800/60 last:border-0">
                  <span className="text-amber-400 mr-1.5">›</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
