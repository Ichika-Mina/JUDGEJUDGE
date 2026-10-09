import React, { useState } from 'react';
import { CardData, OFFLINE_CARDS_DATABASE } from '../data/offlineCards';
import { searchCardByName, getAllCachedCards } from '../services/scryfallService';
import { Search, Sparkles, MessageSquare, ExternalLink, Calendar, Shield } from 'lucide-react';

interface CardInspectorProps {
  onAskAboutCard: (cardName: string) => void;
}

export const CardInspector: React.FC<CardInspectorProps> = ({ onAskAboutCard }) => {
  const [query, setQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardData>(OFFLINE_CARDS_DATABASE[0]); // Default Blood Moon
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cachedCards = getAllCachedCards();

  const handleSearch = async (nameToSearch?: string) => {
    const cardNameToFind = (nameToSearch || query).trim();
    if (!cardNameToFind) return;

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const card = await searchCardByName(cardNameToFind);
      if (card) {
        setSelectedCard(card);
      } else {
        setErrorMsg(`Card "${cardNameToFind}" could not be found online or offline.`);
      }
    } catch (err: any) {
      setErrorMsg(`Error searching card: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Search className="w-5 h-5 text-amber-400" /> Card Oracle & Official Tournament Rulings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Look up official Oracle text, card types, and Gatherer/Scryfall rulings with offline caching.
        </p>
      </div>

      {/* Search Bar & Quick Cards */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search card name (e.g. Urza's Saga, Blood Moon, Humility, Dress Down)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Lookup'}
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-rose-400 px-1">{errorMsg}</p>
        )}

        {/* Quick Offline Available Cards */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1 px-1">
            Pre-Cached Complex Rules Cards:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {cachedCards.slice(0, 10).map((card) => (
              <button
                key={card.id}
                onClick={() => {
                  setSelectedCard(card);
                  setQuery(card.name);
                }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedCard.name === card.name
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {card.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Card View */}
      {selectedCard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Frame Display */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selectedCard.name}</h3>
                <span className="text-xs text-amber-400 font-medium">{selectedCard.type_line}</span>
              </div>
              {selectedCard.mana_cost && (
                <span className="font-mono text-sm font-bold text-amber-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {selectedCard.mana_cost}
                </span>
              )}
            </div>

            {/* Oracle Text Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-serif min-h-[120px]">
              {selectedCard.oracle_text || 'No oracle rules text.'}
            </div>

            {/* Power / Toughness */}
            {selectedCard.power !== undefined && selectedCard.toughness !== undefined && (
              <div className="flex justify-end">
                <span className="font-bold text-sm text-slate-100 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                  {selectedCard.power} / {selectedCard.toughness}
                </span>
              </div>
            )}

            {/* Ask Judge Button */}
            <button
              onClick={() => onAskAboutCard(selectedCard.name)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> Ask Judge Gemma About This Card
            </button>
          </div>

          {/* Official Rulings & Judge Notes */}
          <div className="md:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" /> Official Gatherer & Tournament Rulings
              </h4>

              {selectedCard.rulings && selectedCard.rulings.length > 0 ? (
                <div className="space-y-3">
                  {selectedCard.rulings.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
                        <Calendar className="w-3 h-3" />
                        <span>{r.date}</span>
                      </div>
                      <p className="leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                  No specific Gatherer rulings published for this card. Standard Comprehensive Rules apply.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
