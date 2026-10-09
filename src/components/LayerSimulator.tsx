import React, { useState } from 'react';
import { evaluateLayers, PermanentState, LayerEffect, LayerNumber } from '../services/layerEngine';
import { Layers, Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const LayerSimulator: React.FC = () => {
  // Base permanent
  const [permanent, setPermanent] = useState<PermanentState>({
    name: 'Target Permanent',
    cardTypes: ['Creature'],
    subtypes: ['Avatar'],
    colors: ['Black'],
    abilities: ["Gets -X/-X where X is your life total"],
    basePower: 13,
    baseToughness: 13,
    currentPower: 13,
    currentToughness: 13,
    controller: 'Player A',
    manaValue: 1,
  });

  // Active layer effects list
  const [effects, setEffects] = useState<LayerEffect[]>([
    {
      id: 'dress-down',
      source: 'Dress Down',
      layer: '6',
      description: 'Creatures lose all abilities',
      timestamp: 1,
      effectType: 'ability_remove',
      value: {},
    },
    {
      id: 'deaths-shadow-mod',
      source: "Death's Shadow static",
      layer: '7c',
      description: "-X/-X where X is life total (-10/-10)",
      timestamp: 0,
      effectType: 'mod_pt',
      value: { powerDelta: -10, toughnessDelta: -10 },
    },
  ]);

  // Quick Presets
  const loadPreset = (type: 'humility-opalescence-1' | 'humility-opalescence-2' | 'blood-moon-saga' | 'dress-down-shadow') => {
    if (type === 'humility-opalescence-1') {
      // Opalescence then Humility
      setPermanent({
        name: 'Humility',
        cardTypes: ['Enchantment'],
        subtypes: [],
        colors: ['White'],
        abilities: ['All creatures lose all abilities and have base power and toughness 1/1'],
        basePower: 0,
        baseToughness: 0,
        currentPower: 0,
        currentToughness: 0,
        controller: 'Player A',
        manaValue: 4,
      });
      setEffects([
        {
          id: 'opalescence-type',
          source: 'Opalescence',
          layer: '4',
          description: 'Non-Aura enchantments become creatures in addition to other types',
          timestamp: 1,
          effectType: 'type',
          value: { addTypes: ['Creature'] },
        },
        {
          id: 'opalescence-pt',
          source: 'Opalescence',
          layer: '7b',
          description: 'Base P/T equal to mana value (4/4)',
          timestamp: 1,
          effectType: 'set_pt',
          value: { power: 4, toughness: 4 },
        },
        {
          id: 'humility-abilities',
          source: 'Humility',
          layer: '6',
          description: 'Creatures lose all abilities',
          timestamp: 2,
          effectType: 'ability_remove',
          value: {},
        },
        {
          id: 'humility-pt',
          source: 'Humility',
          layer: '7b',
          description: 'Creatures have base P/T 1/1',
          timestamp: 2,
          effectType: 'set_pt',
          value: { power: 1, toughness: 1 },
        },
      ]);
    } else if (type === 'humility-opalescence-2') {
      // Humility then Opalescence
      setPermanent({
        name: 'Humility',
        cardTypes: ['Enchantment'],
        subtypes: [],
        colors: ['White'],
        abilities: ['All creatures lose all abilities and have base power and toughness 1/1'],
        basePower: 0,
        baseToughness: 0,
        currentPower: 0,
        currentToughness: 0,
        controller: 'Player A',
        manaValue: 4,
      });
      setEffects([
        {
          id: 'opalescence-type',
          source: 'Opalescence',
          layer: '4',
          description: 'Non-Aura enchantments become creatures in addition to other types',
          timestamp: 2,
          effectType: 'type',
          value: { addTypes: ['Creature'] },
        },
        {
          id: 'opalescence-pt',
          source: 'Opalescence',
          layer: '7b',
          description: 'Base P/T equal to mana value (4/4)',
          timestamp: 2,
          effectType: 'set_pt',
          value: { power: 4, toughness: 4 },
        },
        {
          id: 'humility-abilities',
          source: 'Humility',
          layer: '6',
          description: 'Creatures lose all abilities',
          timestamp: 1,
          effectType: 'ability_remove',
          value: {},
        },
        {
          id: 'humility-pt',
          source: 'Humility',
          layer: '7b',
          description: 'Creatures have base P/T 1/1',
          timestamp: 1,
          effectType: 'set_pt',
          value: { power: 1, toughness: 1 },
        },
      ]);
    } else if (type === 'blood-moon-saga') {
      setPermanent({
        name: "Urza's Saga",
        cardTypes: ['Enchantment', 'Land'],
        subtypes: ["Urza's", 'Saga'],
        colors: ['Colorless'],
        abilities: ['Chapter I, II, III abilities'],
        basePower: 0,
        baseToughness: 0,
        currentPower: 0,
        currentToughness: 0,
        controller: 'Player A',
        manaValue: 0,
      });
      setEffects([
        {
          id: 'blood-moon-type',
          source: 'Blood Moon',
          layer: '4',
          description: 'Nonbasic lands are Mountains (loses other land subtypes & intrinsic abilities)',
          timestamp: 1,
          effectType: 'type',
          value: { setLandType: 'Mountain' },
        },
      ]);
    } else if (type === 'dress-down-shadow') {
      setPermanent({
        name: "Death's Shadow",
        cardTypes: ['Creature'],
        subtypes: ['Avatar'],
        colors: ['Black'],
        abilities: ["Gets -X/-X where X is your life total"],
        basePower: 13,
        baseToughness: 13,
        currentPower: 13,
        currentToughness: 13,
        controller: 'Player A',
        manaValue: 1,
      });
      setEffects([
        {
          id: 'dress-down-6',
          source: 'Dress Down',
          layer: '6',
          description: 'Creatures lose all abilities',
          timestamp: 1,
          effectType: 'ability_remove',
          value: {},
        },
      ]);
    }
  };

  // Add custom effect
  const [newSource, setNewSource] = useState('Anthem');
  const [newLayer, setNewLayer] = useState<LayerNumber>('7c');
  const [newDesc, setNewDesc] = useState('+1/+1 to creatures');

  const handleAddEffect = () => {
    let effectType: LayerEffect['effectType'] = 'mod_pt';
    let val: any = { powerDelta: 1, toughnessDelta: 1 };

    if (newLayer === '4') {
      effectType = 'type';
      val = { addTypes: ['Artifact'] };
    } else if (newLayer === '5') {
      effectType = 'color';
      val = { setColors: ['Blue'] };
    } else if (newLayer === '6') {
      effectType = 'ability_add';
      val = { ability: 'Flying' };
    } else if (newLayer === '7b') {
      effectType = 'set_pt';
      val = { power: 1, toughness: 1 };
    } else if (newLayer === '7d') {
      effectType = 'counters_pt';
      val = { plusCounters: 1 };
    }

    const newEffect: LayerEffect = {
      id: `eff-${Date.now()}`,
      source: newSource,
      layer: newLayer,
      description: newDesc,
      timestamp: effects.length + 1,
      effectType,
      value: val,
    };

    setEffects([...effects, newEffect]);
  };

  const removeEffect = (id: string) => {
    setEffects(effects.filter((e) => e.id !== id));
  };

  const shiftTimestamp = (id: string, delta: number) => {
    setEffects((prev) =>
      prev.map((e) => (e.id === id ? { ...e, timestamp: Math.max(1, e.timestamp + delta) } : e))
    );
  };

  const { finalState, steps } = evaluateLayers(permanent, effects);

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" /> Continuous Effects Layer Sandbox (CR 613)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate how multiple continuous effects, timestamps, and layer hierarchies interact on a permanent.
          </p>
        </div>

        {/* Preset buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Presets:</span>
          <button
            onClick={() => loadPreset('humility-opalescence-1')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 hover:text-amber-300 transition cursor-pointer"
          >
            Opalescence → Humility
          </button>
          <button
            onClick={() => loadPreset('humility-opalescence-2')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 hover:text-amber-300 transition cursor-pointer"
          >
            Humility → Opalescence
          </button>
          <button
            onClick={() => loadPreset('blood-moon-saga')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 hover:text-amber-300 transition cursor-pointer"
          >
            Blood Moon on Saga
          </button>
          <button
            onClick={() => loadPreset('dress-down-shadow')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 hover:text-amber-300 transition cursor-pointer"
          >
            Dress Down on Shadow
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel & Live Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Permanent & Effects Controls */}
        <div className="space-y-4">
          {/* Target Permanent Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center justify-between">
              <span>Target Permanent Base Stats</span>
              <span className="text-[10px] text-slate-400 font-mono">CR 613.1</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={permanent.name}
                  onChange={(e) => setPermanent({ ...permanent, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Card Types</label>
                  <input
                    type="text"
                    value={permanent.cardTypes.join(', ')}
                    onChange={(e) =>
                      setPermanent({
                        ...permanent,
                        cardTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Subtypes</label>
                  <input
                    type="text"
                    value={permanent.subtypes.join(', ')}
                    onChange={(e) =>
                      setPermanent({
                        ...permanent,
                        subtypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Base Power</label>
                  <input
                    type="number"
                    value={permanent.basePower}
                    onChange={(e) =>
                      setPermanent({ ...permanent, basePower: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Base Toughness</label>
                  <input
                    type="number"
                    value={permanent.baseToughness}
                    onChange={(e) =>
                      setPermanent({ ...permanent, baseToughness: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mana Value</label>
                  <input
                    type="number"
                    value={permanent.manaValue}
                    onChange={(e) =>
                      setPermanent({ ...permanent, manaValue: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Continuous Effects */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center justify-between">
              <span>Active Continuous Effects ({effects.length})</span>
              <span className="text-[10px] text-slate-400">Timestamps apply in ties</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {effects.map((eff) => (
                <div
                  key={eff.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <span>{eff.source}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
                        Layer {eff.layer}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{eff.description}</p>
                    <span className="text-[10px] text-slate-500">Timestamp: {eff.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => shiftTimestamp(eff.id, 1)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      title="Increase timestamp (later)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => shiftTimestamp(eff.id, -1)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                      title="Decrease timestamp (earlier)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeEffect(eff.id)}
                      className="p-1 hover:bg-rose-950/60 rounded text-slate-400 hover:text-rose-400"
                      title="Delete effect"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Effect Controls */}
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block">Add Continuous Effect:</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Source Name"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 col-span-2"
                />
                <select
                  value={newLayer}
                  onChange={(e) => setNewLayer(e.target.value as LayerNumber)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  <option value="1">Layer 1 (Copy)</option>
                  <option value="2">Layer 2 (Control)</option>
                  <option value="3">Layer 3 (Text)</option>
                  <option value="4">Layer 4 (Type)</option>
                  <option value="5">Layer 5 (Color)</option>
                  <option value="6">Layer 6 (Abilities)</option>
                  <option value="7a">Layer 7a (CDA)</option>
                  <option value="7b">Layer 7b (Set P/T)</option>
                  <option value="7c">Layer 7c (Mod P/T)</option>
                  <option value="7d">Layer 7d (Counters)</option>
                  <option value="7e">Layer 7e (Switch)</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Effect Description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
              />
              <button
                onClick={handleAddEffect}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Effect to Stack
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 7 Layers Step-by-Step Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Final Evaluated Output Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Final Permanent Characteristics (After All Layers)
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                P/T: {finalState.currentPower} / {finalState.currentToughness}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Name</span>
                <span className="font-semibold text-slate-200">{finalState.name}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Types</span>
                <span className="font-semibold text-slate-200">{finalState.cardTypes.join(' ')}</span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Subtypes</span>
                <span className="font-semibold text-slate-200">
                  {finalState.subtypes.length > 0 ? finalState.subtypes.join(' ') : '—'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Colors</span>
                <span className="font-semibold text-slate-200">{finalState.colors.join(', ')}</span>
              </div>
            </div>

            <div className="mt-2.5 p-2 rounded bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">Abilities on Battlefield:</span>
              <span className="text-slate-300">
                {finalState.abilities.length > 0 ? finalState.abilities.join(' • ') : 'None (No abilities)'}
              </span>
            </div>
          </div>

          {/* Sequential Layer Walkthrough */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Hierarchical Execution Order (CR 613.1a – 613.4e)
            </h4>

            {steps.map((step) => {
              const hasApplied = step.effectsApplied.length > 0;
              return (
                <div
                  key={step.layer}
                  className={`p-3 rounded-xl border transition ${
                    hasApplied
                      ? 'bg-slate-900/90 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                          hasApplied
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {step.layer}
                      </span>
                      <div>
                        <span className="font-bold text-slate-200">{step.name}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">{step.crRule}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        hasApplied ? 'bg-emerald-950 text-emerald-300' : 'text-slate-500'
                      }`}
                    >
                      {hasApplied ? `${step.effectsApplied.length} Applied` : 'Pass'}
                    </span>
                  </div>

                  {hasApplied && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs space-y-1.5">
                      {step.effectsApplied.map((eff, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-300">
                          <span className="font-medium text-amber-300">• {eff.source}: {eff.description}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Timestamp {eff.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
