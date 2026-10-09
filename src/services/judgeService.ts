import { identifyCardsInText, evaluateMechanicalInteraction } from './offlineJudgeEngine';

export interface JudgeResponse {
  answer: string;
  source: 'online_ai' | 'offline_rules_engine';
  rulesCited: string[];
  cardsMatched: string[];
  timestamp: string;
}

export async function askJudge(
  question: string,
  involvedCards: string[] = [],
  history: { role: 'user' | 'judge'; text: string }[] = [],
  forceOffline: boolean = false
): Promise<JudgeResponse> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // If online and not forced offline, try server-side Gemma AI
  if (isOnline && !forceOffline) {
    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          cardNames: involvedCards,
          history,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.answer) {
          const rawRules = data.answer.match(/CR\s+\d+(\.\d+[a-z]?)?/gi) || [];
          const matchedRules: string[] = Array.from(
            new Set<string>(rawRules.map((r: string) => r.toUpperCase()))
          );

          return {
            answer: data.answer,
            source: 'online_ai',
            rulesCited: matchedRules,
            cardsMatched: involvedCards,
            timestamp: new Date().toLocaleTimeString(),
          };
        }
      }
    } catch (e) {
      console.warn('Online judge call failed, falling back to offline engine:', e);
    }
  }

  // Fallback: Offline MTG Rules Engine
  return resolveOfflineRuling(question, involvedCards);
}

export async function resolveOfflineRuling(
  question: string,
  userCards: string[] = []
): Promise<JudgeResponse> {
  // 1. Identify all cards mentioned in question and attached chips
  const identifiedCards = await identifyCardsInText(question, userCards);

  // 2. Mechanically evaluate card text, layers, triggers, SBAs, and priority
  const evaluation = evaluateMechanicalInteraction(question, identifiedCards);

  const formattedAnswer = `**Direct Ruling:**
${evaluation.directRuling}

**Step-by-Step Rules Breakdown:**
${evaluation.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

**Tournament Table Guidance:**
${evaluation.tournamentTip}`;

  return {
    answer: formattedAnswer,
    source: 'offline_rules_engine',
    rulesCited: evaluation.rulesCited,
    cardsMatched: evaluation.cardsInvolved.map((c) => c.name),
    timestamp: new Date().toLocaleTimeString(),
  };
}
