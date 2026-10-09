import { CardData, OFFLINE_CARDS_DATABASE } from '../data/offlineCards';
import { FAMOUS_INTERACTIONS } from '../data/famousInteractions';
import { MTG_RULES_CORPUS, GLOSSARY_TERMS } from '../data/rulesCorpus';
import { getCardFromIndexedDB, searchCardsInIndexedDB } from './offlineStorageService';

export interface MechanicalAnalysisResult {
  directRuling: string;
  steps: string[];
  rulesCited: string[];
  tournamentTip: string;
  cardsInvolved: CardData[];
}

// Extract cards from query string
export async function identifyCardsInText(
  text: string,
  userSelectedCards: string[] = []
): Promise<CardData[]> {
  const cardsFound: CardData[] = [];
  const textLower = text.toLowerCase();

  // 1. First add any explicitly user-selected cards
  for (const name of userSelectedCards) {
    const card = (await getCardFromIndexedDB(name)) ||
      OFFLINE_CARDS_DATABASE.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (card && !cardsFound.some((c) => c.name.toLowerCase() === card.name.toLowerCase())) {
      cardsFound.push(card);
    }
  }

  // 2. Scan offline preloaded database
  for (const card of OFFLINE_CARDS_DATABASE) {
    if (
      textLower.includes(card.name.toLowerCase()) &&
      !cardsFound.some((c) => c.name.toLowerCase() === card.name.toLowerCase())
    ) {
      cardsFound.push(card);
    }
  }

  // 3. Scan IndexedDB for other cards
  if (cardsFound.length < 2) {
    try {
      const candidates = await searchCardsInIndexedDB(text.slice(0, 30), 5);
      for (const card of candidates) {
        if (
          textLower.includes(card.name.toLowerCase()) &&
          !cardsFound.some((c) => c.name.toLowerCase() === card.name.toLowerCase())
        ) {
          cardsFound.push(card);
        }
      }
    } catch {
      // IndexedDB query fallback
    }
  }

  return cardsFound;
}

// Evaluate interaction mechanically from cards and question text
export function evaluateMechanicalInteraction(
  question: string,
  cards: CardData[]
): MechanicalAnalysisResult {
  const qLower = question.toLowerCase();
  const rulesCited = new Set<string>();
  const steps: string[] = [];
  let directRuling = '';
  let tournamentTip = '';

  // Check if cards or text match a famous interaction
  for (const item of FAMOUS_INTERACTIONS) {
    const cardMatch = item.cards.filter((c) =>
      cards.some((found) => found.name.toLowerCase() === c.toLowerCase()) ||
      qLower.includes(c.toLowerCase())
    ).length;

    if (cardMatch >= 2 || (cardMatch >= 1 && item.cards.length === 1)) {
      item.rulesCited.forEach((r) => rulesCited.add(r));
      return {
        directRuling: item.shortRuling,
        steps: item.detailedAnalysis
          .split('\n')
          .map((l) => l.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean),
        rulesCited: Array.from(rulesCited),
        tournamentTip: item.judgeTip,
        cardsInvolved: cards,
      };
    }
  }

  // Detailed Mechanical Parser:
  const cardTexts = cards.map((c) => c.oracle_text.toLowerCase()).join(' ');
  const cardNames = cards.map((c) => c.name).join(' and ');

  const hasLayerTypeChange = cardTexts.includes('mountain') || cardTexts.includes('basic land type') || cardTexts.includes('in addition to its other types') || qLower.includes('blood moon') || qLower.includes('type');
  const hasAbilityRemoval = cardTexts.includes('lose all abilities') || cardTexts.includes('loses all abilities') || qLower.includes('dress down') || qLower.includes('humility');
  const hasBasePTSetting = cardTexts.includes('base power and toughness') || cardTexts.includes('base power and base toughness') || qLower.includes('humility') || qLower.includes('opalescence');
  const hasTrigger = cardTexts.includes('when ') || cardTexts.includes('whenever ') || cardTexts.includes('at the beginning') || qLower.includes('trigger') || qLower.includes('dies');
  const hasReplacement = cardTexts.includes('instead') || cardTexts.includes('enters with') || cardTexts.includes('twice that many') || qLower.includes('instead') || qLower.includes('replacement');
  const hasTimingRestriction = cardTexts.includes('only any time they could cast a sorcery') || qLower.includes('teferi') || qLower.includes('cascade') || qLower.includes('suspend');
  const hasDeathtouchTrample = (cardTexts.includes('deathtouch') && cardTexts.includes('trample')) || (qLower.includes('deathtouch') && qLower.includes('trample'));
  const hasIndestructible0Toughness = (cardTexts.includes('indestructible') || qLower.includes('indestructible')) && (qLower.includes('0 toughness') || qLower.includes('-x/-x') || qLower.includes('toxic deluge'));

  if (hasLayerTypeChange && hasAbilityRemoval) {
    // e.g. Blood Moon + Magus of the Moon / Dryad / Saga
    rulesCited.add('CR 613.1d');
    rulesCited.add('CR 613.1f');
    rulesCited.add('CR 613.7');
    rulesCited.add('CR 613.8');

    directRuling = `Continuous effects are evaluated strictly in layer order: Type-changing effects apply in Layer 4 (CR 613.1d), before ability removal applies in Layer 6 (CR 613.1f).`;
    steps.push(`In Layer 4 (CR 613.1d), type-changing effects apply to nonbasic lands or permanents.`);
    steps.push(`In Layer 6 (CR 613.1f), abilities are removed. Because Layer 4 applied first, earlier layer modifications remain locked in.`);
    steps.push(`If effects apply in the same layer without dependency (CR 613.8), timestamp order (CR 613.7) determines the winner.`);
    tournamentTip = `Ask players for the exact order permanents entered the battlefield to determine timestamp order.`;
  } else if (hasAbilityRemoval && hasBasePTSetting) {
    // e.g. Humility / Opalescence
    rulesCited.add('CR 613.1d');
    rulesCited.add('CR 613.1f');
    rulesCited.add('CR 613.4b');
    rulesCited.add('CR 613.7');

    directRuling = `Abilities are removed in Layer 6 (CR 613.1f), while base power and toughness are set in Layer 7b (CR 613.4b) based on timestamp order.`;
    steps.push(`Layer 4 determines permanent types (e.g. non-Aura enchantments become creatures).`);
    steps.push(`Layer 6 removes abilities from all applicable creatures.`);
    steps.push(`Layer 7b sets base power and toughness. Whichever permanent entered most recently holds the newer timestamp (CR 613.7) and determines final P/T.`);
    tournamentTip = `Remind players that Layer 4 type changes and Layer 7b P/T settings function even if the permanent lost its text in Layer 6.`;
  } else if (hasTimingRestriction) {
    // e.g. Teferi vs Cascade / Suspend
    rulesCited.add('CR 307.1');
    rulesCited.add('CR 101.2');
    rulesCited.add('CR 702.85');

    directRuling = `The restriction prevents the spell from being cast. In MTG, a 'can’t' restriction always beats a 'can' permission (CR 101.2).`;
    steps.push(`"Any time you could cast a sorcery" requires an empty stack, active player main phase, and priority (CR 307.1).`);
    steps.push(`When Cascade or Suspend attempts to cast an exiled card, the triggered ability is still resolving on the stack (CR 702.85).`);
    steps.push(`Because the stack is not empty, the timing restriction is violated and the card cannot be cast.`);
    tournamentTip = `Clarify that Cascade still exiles cards and stops on a valid spell, but that spell simply remains exiled without being cast.`;
  } else if (hasReplacement) {
    // Replacement effects (Doubling Season, Rest in Peace, Chains)
    rulesCited.add('CR 614.1');
    rulesCited.add('CR 616.1');
    rulesCited.add('CR 606.4');

    directRuling = `Replacement effects modify an event as it happens instead of letting it occur normally (CR 614.1). If multiple apply, the affected player or controller of the affected object chooses the order (CR 616.1).`;
    steps.push(`Identify the original event being modified (e.g. drawing a card, putting counters, entering battlefield).`);
    steps.push(`Check if the counter addition is an activation cost (CR 606.4) or an effect. Replacement effects like Doubling Season only modify effects, not costs.`);
    steps.push(`If multiple replacement effects apply simultaneously, the affected player orders them sequentially (CR 616.1).`);
    tournamentTip = `Cost vs Effect is the key distinction: activating a + loyalty ability is paying a cost and cannot be doubled.`;
  } else if (hasTrigger) {
    // Simultaneous triggers / APNAP
    rulesCited.add('CR 101.4');
    rulesCited.add('CR 405.5');
    rulesCited.add('CR 603.3');

    directRuling = `Simultaneous triggers resolve in APNAP order (Active Player, Non-Active Player). The Non-Active Player's triggers resolve first (CR 101.4c).`;
    steps.push(`All triggered abilities triggered by the event wait to be put on the stack (CR 603.3).`);
    steps.push(`Active Player (whose turn it is) puts their triggers onto the stack first in any order.`);
    steps.push(`Non-Active Player puts their triggers on top in turn order.`);
    steps.push(`The stack resolves LIFO (Last In, First Out) via CR 405.5, meaning NAP triggers resolve first.`);
    tournamentTip = `In multiplayer Commander, turn order dictates trigger placement. The player immediately preceding the active player resolves first.`;
  } else if (hasDeathtouchTrample) {
    // Deathtouch + Trample
    rulesCited.add('CR 702.2');
    rulesCited.add('CR 702.19');
    rulesCited.add('CR 510.1');

    directRuling = `Any 1 damage from a source with deathtouch is lethal damage (CR 702.2c). Trample allows all remaining damage beyond 1 per blocker to trample through to the defending player.`;
    steps.push(`The attacking player only needs to assign 1 point of combat damage to each blocking creature.`);
    steps.push(`The rest of the creature's combat damage is assigned directly to the defending player or planeswalker (CR 702.19b).`);
    tournamentTip = `Even if the blocker has high toughness (e.g. 10/10), exactly 1 damage is lethal from deathtouch.`;
  } else if (hasIndestructible0Toughness) {
    // Indestructible vs 0 Toughness
    rulesCited.add('CR 704.5f');
    rulesCited.add('CR 702.12');

    directRuling = `Indestructible protects against lethal damage and effects that say 'destroy', but DOES NOT protect against having 0 or less toughness (CR 704.5f).`;
    steps.push(`Indestructible prevents destruction from damage or 'destroy' effects (CR 702.12).`);
    steps.push(`A creature with 0 or less toughness is put into the graveyard as a state-based action (CR 704.5f).`);
    steps.push(`Because state-based action 704.5f is not destruction, the creature is placed into the graveyard immediately.`);
    tournamentTip = `Explain to players that -X/-X counters or static reductions bypass indestructible completely.`;
  } else {
    // Comprehensive general MTG resolution
    rulesCited.add('CR 117');
    rulesCited.add('CR 405');
    rulesCited.add('CR 704');
    rulesCited.add('CR 613');

    directRuling = cards.length > 0
      ? `Resolving interaction for ${cardNames}: Spells and abilities resolve using the stack (CR 405), continuous effects apply via the 7 layers (CR 613), and state-based actions check continuously (CR 704).`
      : `MTG rules resolve chronologically: Spells and abilities use the stack (CR 405.5), continuous static effects use the 7 layer system (CR 613), and state-based actions clean the board before priority (CR 704).`;

    if (cards.length > 0) {
      steps.push(`Permanent characteristics: ${cards.map((c) => `${c.name} (${c.type_line})`).join(', ')}.`);
      cards.forEach((c) => {
        if (c.oracle_text) {
          steps.push(`• ${c.name} text: "${c.oracle_text.slice(0, 100)}${c.oracle_text.length > 100 ? '...' : ''}"`);
        }
      });
    }

    steps.push(`State-based actions (CR 704) are evaluated first whenever a player would receive priority.`);
    steps.push(`Continuous effects modify the board state in Layer 1 through Layer 7 order (CR 613.1).`);
    steps.push(`Active player receives priority (CR 117.3b) to cast spells or activate abilities.`);
    tournamentTip = `Check priority and layer order when arbitrating this interaction at tournament tables.`;
  }

  return {
    directRuling,
    steps,
    rulesCited: Array.from(rulesCited),
    tournamentTip: tournamentTip || 'Verify timestamps and state-based actions before issuing final table ruling.',
    cardsInvolved: cards,
  };
}
