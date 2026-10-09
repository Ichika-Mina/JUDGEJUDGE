import { FAMOUS_INTERACTIONS, FamousInteraction } from '../data/famousInteractions';
import { MTG_RULES_CORPUS, RuleEntry, GLOSSARY_TERMS } from '../data/rulesCorpus';
import { OFFLINE_CARDS_DATABASE, CardData } from '../data/offlineCards';

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
          // Extract any rule numbers cited in the AI response (e.g., CR 613.1d)
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

export function resolveOfflineRuling(question: string, userCards: string[] = []): JudgeResponse {
  const qLower = question.toLowerCase();

  // 1. Check if user question or cards match any famous interaction
  let bestInteractionMatch: FamousInteraction | null = null;

  for (const item of FAMOUS_INTERACTIONS) {
    const cardMatchCount = item.cards.filter((c) =>
      qLower.includes(c.toLowerCase()) || userCards.some((uc) => uc.toLowerCase() === c.toLowerCase())
    ).length;

    if (cardMatchCount >= 2) {
      bestInteractionMatch = item;
      break;
    } else if (cardMatchCount >= 1 && (qLower.includes(item.cards[0].toLowerCase()) || qLower.includes(item.cards[1]?.toLowerCase() || ''))) {
      bestInteractionMatch = item;
    }
  }

  if (bestInteractionMatch) {
    const answer = `### ⚖️ Official Judge Ruling: ${bestInteractionMatch.title}
*Offline Engine Mode: High-Confidence Tournament Ruling*

**Direct Ruling:**
${bestInteractionMatch.shortRuling}

---

**Step-by-Step Rules Breakdown:**
${bestInteractionMatch.detailedAnalysis}

---

**Rules & Layers Involved:**
- **Layers:** ${bestInteractionMatch.layersInvolved.join(', ')}
- **Citations:** ${bestInteractionMatch.rulesCited.map((r) => `\`${r}\``).join(', ')}

**Tournament Table Guidance:**
> *${bestInteractionMatch.judgeTip}*`;

    return {
      answer,
      source: 'offline_rules_engine',
      rulesCited: bestInteractionMatch.rulesCited,
      cardsMatched: bestInteractionMatch.cards,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // 2. Identify relevant cards from offline database
  const matchedCards: CardData[] = [];
  for (const card of OFFLINE_CARDS_DATABASE) {
    if (qLower.includes(card.name.toLowerCase()) || userCards.some((uc) => uc.toLowerCase() === card.name.toLowerCase())) {
      matchedCards.push(card);
    }
  }

  // 3. Match relevant Comprehensive Rules
  const matchedRules: RuleEntry[] = [];
  for (const rule of MTG_RULES_CORPUS) {
    const hit =
      qLower.includes(rule.number.toLowerCase()) ||
      rule.keywords?.some((k) => qLower.includes(k.toLowerCase())) ||
      qLower.includes(rule.title.toLowerCase());

    if (hit) {
      matchedRules.push(rule);
    }
  }

  // Check glossary
  const matchedGlossary = GLOSSARY_TERMS.filter((g) => qLower.includes(g.term.toLowerCase()));

  // 4. Construct comprehensive offline ruling synthesis
  const citations: string[] = [];
  matchedRules.forEach((r) => citations.push(`CR ${r.number}`));
  matchedGlossary.forEach((g) => citations.push(g.rule));

  let responseBody = '';

  if (matchedCards.length > 0 || matchedRules.length > 0 || matchedGlossary.length > 0) {
    responseBody += `### ⚖️ Offline Judge Clarification\n\n`;

    if (matchedCards.length > 0) {
      responseBody += `**Identified Permanents & Oracle Text:**\n`;
      for (const card of matchedCards) {
        responseBody += `- **${card.name}** (${card.type_line}${card.mana_cost ? ` • ${card.mana_cost}` : ''})\n  *Oracle:* "${card.oracle_text.replace(/\n/g, ' ')}"\n`;
        if (card.rulings && card.rulings.length > 0) {
          responseBody += `  *Official Gathering Ruling:* ${card.rulings[0].comment}\n`;
        }
      }
      responseBody += `\n---\n\n`;
    }

    if (matchedRules.length > 0) {
      responseBody += `**Applicable Comprehensive Rules:**\n\n`;
      for (const rule of matchedRules.slice(0, 3)) {
        responseBody += `#### Rule ${rule.number} — ${rule.title} (${rule.category})\n`;
        responseBody += `${rule.summary}\n\n`;
        if (rule.subrules && rule.subrules.length > 0) {
          for (const sub of rule.subrules.slice(0, 2)) {
            responseBody += `> **${sub.number}:** ${sub.text}\n\n`;
          }
        }
      }
    }

    if (matchedGlossary.length > 0) {
      responseBody += `**Key Rules Concepts:**\n`;
      for (const g of matchedGlossary) {
        responseBody += `- **${g.term}** (${g.rule}): ${g.definition}\n`;
      }
      responseBody += `\n`;
    }

    responseBody += `\n**Resolution Summary:**\n`;
    if (qLower.includes('layer') || qLower.includes('blood moon') || qLower.includes('humility')) {
      responseBody += `Continuous effects apply in order from Layer 1 through Layer 7. Abilities stripped in Layer 6 do not prevent effects from having applied in earlier layers (Layer 1–5). If effects apply in the same layer or sublayer without a dependency, resolve by timestamp order (CR 613.7).\n`;
    } else if (qLower.includes('trigger') || qLower.includes('die') || qLower.includes('stack')) {
      responseBody += `Simultaneous triggers use APNAP order (Active Player, Non-Active Player). Active player places triggers on the stack first, then each opponent in turn order. Non-active player triggers resolve first (CR 101.4, CR 405.5).\n`;
    } else if (qLower.includes('instead') || qLower.includes('replacement')) {
      responseBody += `Replacement effects modify events as they occur. If multiple replacement effects apply to an event, the affected player or controller of the affected object chooses the order of application (CR 616.1).\n`;
    } else {
      responseBody += `State-based actions are checked whenever a player would receive priority (CR 704). Spells and abilities resolve from the stack top-down in LIFO order (CR 405).\n`;
    }
  } else {
    // General fallback
    responseBody = `### ⚖️ Judge Gemma — General Rules Clarification
*Offline Rules Engine Active*

To resolve your query precisely, please specify the cards or rule mechanisms involved (e.g., *Blood Moon vs Urza's Saga*, *Layer 6 ability removal*, *Active Player Non-Active Player triggers*, or *Replacement effects*).

**Standard Resolution Framework:**
1. **The Stack & Priority (CR 117 / CR 405):** Objects resolve in Last In, First Out order. All players must pass priority in succession on an empty stack to advance steps.
2. **Continuous Effects (CR 613):** Check Layer 1 (Copy) through Layer 7 (P/T). Timestamps break ties in the same layer unless a dependency exists (CR 613.8).
3. **Simultaneous Triggers (CR 101.4 APNAP):** Active player puts triggers on stack first; opponent triggers go on top and resolve first.
4. **State-Based Actions (CR 704):** Checked before any player gets priority; do not use the stack.`;
  }

  return {
    answer: responseBody,
    source: 'offline_rules_engine',
    rulesCited: Array.from(new Set(citations)),
    cardsMatched: matchedCards.map((c) => c.name),
    timestamp: new Date().toLocaleTimeString(),
  };
}
