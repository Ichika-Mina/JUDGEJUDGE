import React, { useState } from 'react';
import { MTG_RULES_CORPUS, GLOSSARY_TERMS, RuleEntry } from '../data/rulesCorpus';
import { BookOpen, Search, Copy, Check, Filter, Bookmark } from 'lucide-react';

interface RulesBrowserProps {
  initialSearch?: string;
  onSelectRuleForChat?: (ruleText: string) => void;
}

export const RulesBrowser: React.FC<RulesBrowserProps> = ({
  initialSearch = '',
  onSelectRuleForChat,
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'rules' | 'glossary'>('rules');
  const [copiedRule, setCopiedRule] = useState<string | null>(null);

  const categories = [
    'All',
    'Continuous Effects & Layers',
    'Spells & Abilities',
    'Turn Structure & Priority',
    'Game Loop & Cleanup',
    'Keyword Abilities',
    'General Principles',
  ];

  const filteredRules = MTG_RULES_CORPUS.filter((r) => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const query = search.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesQuery =
      r.number.toLowerCase().includes(query) ||
      r.title.toLowerCase().includes(query) ||
      r.summary.toLowerCase().includes(query) ||
      r.keywords?.some((k) => k.toLowerCase().includes(query)) ||
      r.subrules?.some((s) => s.number.toLowerCase().includes(query) || s.text.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  const filteredGlossary = GLOSSARY_TERMS.filter((g) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      g.term.toLowerCase().includes(query) ||
      g.definition.toLowerCase().includes(query) ||
      g.rule.toLowerCase().includes(query)
    );
  });

  const handleCopyCitation = (ruleNumber: string, text: string) => {
    navigator.clipboard.writeText(`CR ${ruleNumber}: ${text}`);
    setCopiedRule(ruleNumber);
    setTimeout(() => setCopiedRule(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" /> Magic: The Gathering Comprehensive Rules Explorer
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Authoritative rules corpus and judge glossary with instant offline indexing.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by rule number (e.g. 613, 704, 117) or keyword (e.g. layers, apnap, deathtouch, sba)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rulebook ({filteredRules.length})
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'glossary'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Glossary ({filteredGlossary.length})
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        {activeTab === 'rules' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rules List View */}
      {activeTab === 'rules' ? (
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm rounded-2xl border border-slate-800">
              No rules matched your query. Try searching for "613", "priority", "trigger", or "sba".
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.number}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                      CR {rule.number}
                    </span>
                    <h3 className="font-bold text-base text-slate-100">{rule.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {rule.category}
                    </span>
                    <button
                      onClick={() => handleCopyCitation(rule.number, rule.summary)}
                      className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                      title="Copy rule citation"
                    >
                      {copiedRule === rule.number ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-3">{rule.summary}</p>

                {/* Subrules */}
                {rule.subrules && rule.subrules.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Key Subrules & Clauses:
                    </span>
                    {rule.subrules.map((sub) => (
                      <div
                        key={sub.number}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="font-mono font-bold text-amber-400 mr-2">
                            {sub.number}:
                          </span>
                          <span>{sub.text}</span>
                        </div>
                        <button
                          onClick={() => handleCopyCitation(sub.number, sub.text)}
                          className="flex-shrink-0 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                          title="Copy subrule"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Glossary Terms View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGlossary.map((item) => (
            <div
              key={item.term}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-300">{item.term}</span>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {item.rule}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{item.definition}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
