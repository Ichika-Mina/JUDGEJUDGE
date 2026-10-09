import React, { useState } from 'react';
import { HoverableRuleBadge } from './HoverableRuleBadge';
import { ChevronDown, ChevronUp, ShieldCheck, Layers, Award, Sparkles } from 'lucide-react';

interface FormattedJudgeAnswerProps {
  rawText: string;
  rulesCited?: string[];
  onNavigateToRule?: (ruleNumber: string) => void;
}

interface ParsedRuling {
  title?: string;
  directRuling: string;
  steps: string[];
  layersBreakdown?: string;
  tournamentTip?: string;
  allCitations: string[];
}

function parseRulingText(text: string, existingCitations: string[] = []): ParsedRuling {
  // Extract all rule mentions like CR 613.1d, CR 704, etc.
  const foundCitations = Array.from(
    new Set<string>([
      ...existingCitations,
      ...(text.match(/CR\s+\d+(\.\d+[a-z]?)?/gi) || []).map((r) => r.toUpperCase()),
    ])
  );

  let title = '';
  let directRuling = '';
  let stepsText = '';
  let layersBreakdown = '';
  let tournamentTip = '';

  // Clean title if starts with ### or title line
  const titleMatch = text.match(/^###\s*(?:⚖️\s*)?(?:Official Judge Ruling:\s*)?([^\n]+)/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/\*+/g, '').trim();
  }

  // Extract Direct Ruling
  const directMatch = text.match(/(?:\*\*Direct Ruling:\*\*|Direct Ruling:|Immediate Ruling:|###\s*1\.\s*Direct Ruling)\s*\n*([\s\S]*?)(?=\n*(?:---|###|\*\*Step-by-Step|\*\*Rules & Layers|\*\*Tournament))/i);
  if (directMatch) {
    directRuling = directMatch[1].replace(/\*+/g, '').trim();
  }

  // Extract Step-by-Step Breakdown
  const stepsMatch = text.match(/(?:\*\*Step-by-Step Rules Breakdown:\*\*|###\s*2\.\s*(?:Comprehensive )?Rules Breakdown|Step-by-Step Breakdown:)\s*\n*([\s\S]*?)(?=\n*(?:---|###\s*3|\*\*Rules & Layers|\*\*Tournament|\*\*Layers Involved))/i);
  if (stepsMatch) {
    stepsText = stepsMatch[1].trim();
  }

  // Extract Layers Breakdown if separate
  const layersMatch = text.match(/(?:###\s*3\.\s*Continuous Effects & Layers|\*\*Layers & Timestamps:\*\*|\*\*Layers Involved:\*\*)\s*\n*([\s\S]*?)(?=\n*(?:---|###\s*4|\*\*Tournament|\*\*Citations))/i);
  if (layersMatch) {
    layersBreakdown = layersMatch[1].trim();
  }

  // Extract Tournament Judge Tip
  const tipMatch = text.match(/(?:\*\*Tournament Table Guidance:\*\*|\*\*Tournament Judge Tip:\*\*|###\s*5\.\s*Tournament Judge Tip|Tournament Table Advice:)\s*\n*>*\s*\*?([\s\S]*?)\*?$/i);
  if (tipMatch) {
    tournamentTip = tipMatch[1].replace(/[>*_]/g, '').trim();
  }

  // Fallback if structured sections were not strictly formatted
  if (!directRuling) {
    const paragraphs = text
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith('###') && !p.startsWith('---'));
    directRuling = paragraphs[0] || text;
    stepsText = paragraphs.slice(1).join('\n\n');
  }

  // Split stepsText into individual numbered points if applicable
  const stepItems: string[] = [];
  if (stepsText) {
    const lines = stepsText.split(/\n(?=\d+\.\s|\*\s|-\s)/);
    for (const l of lines) {
      const cleaned = l.replace(/^\d+\.\s*|^[-*]\s*/, '').trim();
      if (cleaned) {
        stepItems.push(cleaned);
      }
    }
  }

  return {
    title,
    directRuling,
    steps: stepItems.length > 0 ? stepItems : (stepsText ? [stepsText] : []),
    layersBreakdown,
    tournamentTip,
    allCitations: foundCitations,
  };
}

// Replaces occurrences of "CR 613.1d" in text with interactive hoverable badges
function renderTextWithHoverableRules(text: string, onNavigateToRule?: (r: string) => void) {
  const parts: React.ReactNode[] = [];
  const regex = /\b(CR\s+\d+(\.\d+[a-z]?)?)\b/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const citation = match[0].toUpperCase();
    parts.push(
      <HoverableRuleBadge
        key={`badge-${match.index}`}
        citation={citation}
        onNavigateToRule={onNavigateToRule}
        inline
      />
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export const FormattedJudgeAnswer: React.FC<FormattedJudgeAnswerProps> = ({
  rawText,
  rulesCited = [],
  onNavigateToRule,
}) => {
  const [showFullSteps, setShowFullSteps] = useState(true);
  const parsed = parseRulingText(rawText, rulesCited);

  return (
    <div className="space-y-3.5 text-slate-100">
      {/* Title if present */}
      {parsed.title && (
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide text-slate-200">
            {parsed.title}
          </span>
        </div>
      )}

      {/* 1. Uncluttered Hero Direct Ruling Card */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/5 border border-amber-500/40 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Official Verdict
          </span>
          <span className="text-[10px] text-slate-400 font-medium">L3 Certified</span>
        </div>

        <p className="text-sm font-semibold text-slate-100 leading-snug">
          {renderTextWithHoverableRules(parsed.directRuling, onNavigateToRule)}
        </p>

        {/* 2. Hoverable Rule Sources Pills (Answer Source) */}
        {parsed.allCitations.length > 0 && (
          <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Rule Sources (Hover to view):
            </span>
            {parsed.allCitations.map((cite) => (
              <HoverableRuleBadge
                key={cite}
                citation={cite}
                onNavigateToRule={onNavigateToRule}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Step-by-Step Breakdown (Organized into Clean Cards) */}
      {parsed.steps.length > 0 && (
        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowFullSteps(!showFullSteps)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 text-xs font-semibold text-slate-300 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>📋</span> Step-by-Step Rules Resolution ({parsed.steps.length} steps)
            </span>
            {showFullSteps ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showFullSteps && (
            <div className="p-3 sm:p-4 space-y-2.5 text-xs text-slate-200">
              {parsed.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/40 border border-slate-800/50"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold text-[10px] flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="leading-relaxed flex-1">
                    {renderTextWithHoverableRules(step, onNavigateToRule)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Layers Breakdown if separate */}
      {parsed.layersBreakdown && (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" /> Continuous Effects & Layers:
          </span>
          <div className="text-slate-300 leading-relaxed pl-1 whitespace-pre-wrap">
            {renderTextWithHoverableRules(parsed.layersBreakdown, onNavigateToRule)}
          </div>
        </div>
      )}

      {/* 5. Tournament Judge Table Guidance */}
      {parsed.tournamentTip && (
        <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-600/30 text-xs flex items-start gap-2 text-amber-200/90">
          <Award className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300 block text-[11px] mb-0.5">
              Tournament Table Tip:
            </span>
            <span className="italic leading-relaxed">{parsed.tournamentTip}</span>
          </div>
        </div>
      )}
    </div>
  );
};
