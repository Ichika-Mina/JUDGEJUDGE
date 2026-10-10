import React, { useState, useRef, useEffect } from 'react';
import { askJudge, JudgeResponse } from '../services/judgeService';
import { FAMOUS_INTERACTIONS } from '../data/famousInteractions';
import { FormattedJudgeAnswer } from './FormattedJudgeAnswer';
import { Send, Mic, MicOff, Copy, Check, Sparkles, BookOpen, Layers, RefreshCw, AlertCircle, Tag, X, Camera } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'judge';
  text: string;
  source?: 'online_ai' | 'offline_rules_engine';
  rulesCited?: string[];
  cardsMatched?: string[];
  timestamp: string;
}

interface JudgeChatProps {
  isOnline: boolean;
  manualOffline: boolean;
  onNavigateToRule?: (ruleNumber: string) => void;
  onNavigateToLayer?: () => void;
  onNavigateToScan?: () => void;
}

export const JudgeChat: React.FC<JudgeChatProps> = ({
  isOnline,
  manualOffline,
  onNavigateToRule,
  onNavigateToLayer,
  onNavigateToScan,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'judge',
      text: `**Direct Ruling:**
Welcome, Planeswalker! I am Judge Gemma, your Level 3 MTG rules arbiter. Ask any complex interaction, continuous layer breakdown, or stack dispute for an immediate ruling.

**Step-by-Step Rules Breakdown:**
1. All rulings are grounded in the official Comprehensive Rules with hoverable citations (e.g. CR 613, CR 117, CR 704).
2. Hover over any rule citation badge to instantly inspect the exact official rule text.
3. Switch between Online Gemma AI and 100% Offline Rules mode anytime.

**Tournament Table Guidance:**
Tap any famous interaction preset above or tag cards to simulate rulings on the fly.`,
      source: isOnline ? 'online_ai' : 'offline_rules_engine',
      rulesCited: ['CR 613', 'CR 117', 'CR 603', 'CR 614', 'CR 704'],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [cardTags, setCardTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  const handleAddTag = (tag: string) => {
    const cleaned = tag.trim();
    if (cleaned && !cardTags.includes(cleaned)) {
      setCardTags((prev) => [...prev, cleaned]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCardTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSend = async (textToSend?: string, attachedCards?: string[]) => {
    const query = (textToSend !== undefined ? textToSend : input).trim();
    if (!query || isLoading) return;

    const cards = attachedCards || cardTags;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
      cardsMatched: cards.length > 0 ? [...cards] : undefined,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === undefined) {
      setInput('');
    }
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response: JudgeResponse = await askJudge(query, cards, historyPayload, manualOffline);

      const judgeMsg: ChatMessage = {
        id: `j-${Date.now()}`,
        role: 'judge',
        text: response.answer,
        source: response.source,
        rulesCited: response.rulesCited,
        cardsMatched: response.cardsMatched,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, judgeMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'judge',
          text: `An unexpected error occurred while consulting the rules: ${err.message || 'Unknown error'}. Please try again.`,
          source: 'offline_rules_engine',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (interaction: typeof FAMOUS_INTERACTIONS[0]) => {
    setCardTags(interaction.cards);
    handleSend(interaction.question, interaction.cards);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem-2.5rem)] md:h-[calc(100vh-4rem)] max-w-5xl mx-auto p-2 sm:p-4">
      {/* Quick Famous Interaction Presets */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Famous Interactions & Edge Cases
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">Click to simulate ruling</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {FAMOUS_INTERACTIONS.slice(0, 6).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-[11px] font-medium text-slate-300 hover:text-amber-300 transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 sm:px-2 py-2 rounded-2xl bg-slate-950/40 border border-slate-900 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-slate-950 font-medium'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wide">
                    {msg.role === 'user' ? 'You' : '⚖️ Judge Gemma'}
                  </span>
                  {msg.source && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        msg.source === 'online_ai'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                          : 'bg-amber-950/70 text-amber-300 border border-amber-700/40'
                      }`}
                    >
                      {msg.source === 'online_ai' ? 'Online AI Model' : 'Offline Rules Engine'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] opacity-75">
                  <span>{msg.timestamp}</span>
                  {msg.role === 'judge' && (
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.text)}
                      title="Copy ruling to clipboard"
                      className="p-1 hover:bg-slate-800 rounded transition cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Attached Cards Chips */}
              {msg.cardsMatched && msg.cardsMatched.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {msg.cardsMatched.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-amber-300 border border-amber-500/20"
                    >
                      🃏 {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Message Content */}
              {msg.role === 'judge' ? (
                <FormattedJudgeAnswer
                  rawText={msg.text}
                  rulesCited={msg.rulesCited}
                  onNavigateToRule={onNavigateToRule}
                />
              ) : (
                <div className="text-sm font-medium text-slate-950 leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] rounded-2xl p-4 bg-slate-900/90 border border-slate-800 text-slate-200">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Judge Gemma is consulting Comprehensive Rules & layer dependencies...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input & Control Box */}
      <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl">
        {/* Card tag chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-amber-400" /> Cards:
          </span>
          {cardTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-amber-100 p-0.5 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagInput.trim()) {
                e.preventDefault();
                handleAddTag(tagInput);
              }
            }}
            placeholder="+ Add card name (Press Enter)"
            className="text-xs bg-slate-800/60 border border-slate-700/60 rounded-full px-2.5 py-0.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Text Area & Actions */}
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder="Ask a rules question (e.g. 'What happens if Blood Moon is played while Urza's Saga is out?', 'Does Dress Down kill Death's Shadow?')..."
            className="flex-1 resize-none bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
          />

          <div className="flex flex-col gap-1.5">
            {/* Scan Card Camera Shortcut */}
            {onNavigateToScan && (
              <button
                onClick={onNavigateToScan}
                type="button"
                className="p-2 rounded-xl border bg-slate-800/80 border-slate-700 text-amber-400 hover:text-amber-300 hover:bg-slate-700 transition cursor-pointer"
                title="Scan card with camera to get rules"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}

            {/* Voice Dictation Button */}
            <button
              onClick={toggleListening}
              type="button"
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isListening
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Voice input (dictate ruling request)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit Button */}
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              type="button"
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition shadow-md cursor-pointer disabled:cursor-not-allowed"
              title="Submit rules query"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Press Enter to ask • Shift+Enter for new line</span>
          <span className="flex items-center gap-1">
            {manualOffline ? (
              <span className="text-amber-400">Offline Rules Mode</span>
            ) : isOnline ? (
              <span className="text-emerald-400">Online Gemini 3.8 / Gemma Mode</span>
            ) : (
              <span className="text-amber-400">Offline Rules Mode (Disconnected)</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
