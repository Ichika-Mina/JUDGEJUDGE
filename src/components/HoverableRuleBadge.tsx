import React, { useState, useRef, useEffect } from 'react';
import { lookupRuleSource, RuleSourceDetail } from '../data/rulesCorpus';
import { BookOpen, ExternalLink, HelpCircle } from 'lucide-react';

interface HoverableRuleBadgeProps {
  citation: string;
  onNavigateToRule?: (ruleNumber: string) => void;
  inline?: boolean;
}

export const HoverableRuleBadge: React.FC<HoverableRuleBadgeProps> = ({
  citation,
  onNavigateToRule,
  inline = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ruleDetail, setRuleDetail] = useState<RuleSourceDetail | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const detail = lookupRuleSource(citation);
    setRuleDetail(detail);
  }, [citation]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigateToRule) {
      const cleanNum = citation.replace(/^CR\s*/i, '').trim();
      onNavigateToRule(cleanNum);
    }
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleBadgeClick}
        className={`group inline-flex items-center gap-1 font-mono font-bold transition rounded cursor-pointer select-none ${
          inline
            ? 'px-1.5 py-0.5 text-[11px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30'
            : 'px-2.5 py-1 text-xs bg-slate-800/90 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 shadow-xs'
        }`}
        title={`Hover to preview source: ${citation}`}
      >
        <BookOpen className="w-3 h-3 text-amber-400 opacity-80 group-hover:opacity-100" />
        <span>{citation}</span>
      </button>

      {/* Hover Floating Source Popover */}
      {isOpen && ruleDetail && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-84 p-3 rounded-xl bg-slate-900 border border-amber-500/50 shadow-2xl text-left pointer-events-auto backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                CR {ruleDetail.number}
              </span>
              <span className="font-semibold text-xs text-slate-100 truncate max-w-[150px]">
                {ruleDetail.title}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              {ruleDetail.category}
            </span>
          </div>

          {/* Official Rule Text */}
          <p className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
            {ruleDetail.text}
          </p>

          {/* Action Footer */}
          {onNavigateToRule && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Official Comprehensive Rules</span>
              <button
                type="button"
                onClick={handleBadgeClick}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
              >
                <span>Inspect in Rulebook</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {/* Tooltip beak/triangle */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-slate-900 border-r border-b border-amber-500/50 rotate-45" />
        </div>
      )}
    </span>
  );
};
