import React, { useState, useEffect } from 'react';
import {
  getOfflineDatabaseStats,
  importMTGJSONData,
  importComprehensiveRulebook,
  initializeOfflineDatabase,
  searchCardsInIndexedDB,
} from '../services/offlineStorageService';
import { CardData } from '../data/offlineCards';
import { Database, Upload, Check, AlertCircle, RefreshCw, FileText, Search, HardDrive, ShieldCheck } from 'lucide-react';

export const OfflineDataManager: React.FC = () => {
  const [stats, setStats] = useState<{
    cardCount: number;
    ruleCount: number;
    lastUpdated?: string;
    source?: string;
  }>({ cardCount: 0, ruleCount: 0 });

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testSearch, setTestSearch] = useState('');
  const [testResults, setTestResults] = useState<CardData[]>([]);

  const loadStats = async () => {
    const s = await getOfflineDatabaseStats();
    setStats(s);
  };

  useEffect(() => {
    initializeOfflineDatabase().then(loadStats);
  }, []);

  // Handle MTGJSON file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setErrorMsg(null);
    setImportStatus(`Reading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      const text = await file.text();
      setImportStatus('Parsing MTGJSON structure...');
      const json = JSON.parse(text);

      setImportStatus('Indexing cards into offline IndexedDB...');
      const result = await importMTGJSONData(json, (pct, count) => {
        setImportProgress(pct);
        setImportStatus(`Indexed ${count.toLocaleString()} cards (${pct}%)...`);
      });

      setImportStatus(
        `Successfully imported ${result.importedCount.toLocaleString()} cards across ${
          result.setNames.length
        } sets!`
      );
      await loadStats();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Import failed: ${err.message || 'Invalid JSON file format'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Rulebook file upload (.txt or .json)
  const handleRulebookUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setErrorMsg(null);
    setImportStatus(`Parsing rulebook from ${file.name}...`);

    try {
      const text = await file.text();
      const count = await importComprehensiveRulebook(text);
      setImportStatus(`Successfully imported ${count} rule sections into offline storage!`);
      await loadStats();
    } catch (err: any) {
      setErrorMsg(`Rulebook import failed: ${err.message || 'Error parsing file'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleTestSearch = async (query: string) => {
    setTestSearch(query);
    if (!query.trim()) {
      setTestResults([]);
      return;
    }
    const results = await searchCardsInIndexedDB(query, 5);
    setTestResults(results);
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" /> Offline MTG Database & Rulebook Storage
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Load your MTGJSON cards file and official Comprehensive Rules directly into browser IndexedDB for offline tournament play.
        </p>
      </div>

      {/* Database Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Offline Card Database</span>
            <span className="text-lg font-bold text-slate-100 font-mono">
              {stats.cardCount.toLocaleString()} Cards
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Comprehensive Rules</span>
            <span className="text-lg font-bold text-slate-100 font-mono">
              {stats.ruleCount.toLocaleString()} Sections
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Offline Storage State</span>
            <span className="text-xs font-semibold text-emerald-300 block truncate max-w-[170px]">
              {stats.source || 'Active in IndexedDB'}
            </span>
          </div>
        </div>
      </div>

      {/* Upload & Import Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MTGJSON Cards Upload */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" /> Import MTGJSON Cards File
            </h3>
            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              .json (AllPrintings / Atomic)
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Upload your MTGJSON file (e.g. <code>AllPrintings.json</code> or <code>AtomicCards.json</code>).
            All card oracle texts, power/toughness, and rulings will be indexed in browser IndexedDB for offline querying.
          </p>

          <label className="block">
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/40">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <span className="text-xs font-semibold text-amber-400 block">
                Click to Choose MTGJSON File
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Supports AllPrintings, AtomicCards, or Set JSON
              </span>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>

        {/* Rulebook Upload */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Import MTG Rulebook
            </h3>
            <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              .txt / .json
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Upload the official MTG Comprehensive Rules text file (from Wizards of the Coast or Custom).
            All rule clauses (100.1 to 905.7) will be parsed and linked to hoverable citations.
          </p>

          <label className="block">
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/40">
              <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <span className="text-xs font-semibold text-indigo-400 block">
                Click to Choose Rulebook File
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Plain text or JSON rulebook
              </span>
            </div>
            <input
              type="file"
              accept=".txt,.json"
              onChange={handleRulebookUpload}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Progress & Status Feedback */}
      {isImporting && (
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {importStatus}
            </span>
            <span className="font-mono text-slate-400">{importProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-150"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}

      {importStatus && !isImporting && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Test Offline Search in IndexedDB */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-amber-400" /> Test Offline Card Lookup
        </h4>

        <input
          type="text"
          value={testSearch}
          onChange={(e) => handleTestSearch(e.target.value)}
          placeholder="Search card name in offline IndexedDB (e.g. Urza's Saga, Blood Moon, Black Lotus)..."
          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />

        {testResults.length > 0 && (
          <div className="space-y-2 pt-2">
            {testResults.map((card) => (
              <div
                key={card.id || card.name}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200"
              >
                <div className="flex items-center justify-between font-bold text-amber-300 mb-1">
                  <span>{card.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">{card.type_line}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-serif">
                  {card.oracle_text || 'No text'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
