export type LayerNumber = '1' | '2' | '3' | '4' | '5' | '6' | '7a' | '7b' | '7c' | '7d' | '7e';

export interface LayerEffect {
  id: string;
  source: string;
  layer: LayerNumber;
  description: string;
  timestamp: number;
  effectType: 'copy' | 'control' | 'text' | 'type' | 'color' | 'ability_add' | 'ability_remove' | 'cda_pt' | 'set_pt' | 'mod_pt' | 'counters_pt' | 'switch_pt';
  value: any;
}

export interface PermanentState {
  name: string;
  cardTypes: string[];
  subtypes: string[];
  colors: string[];
  abilities: string[];
  basePower: number;
  baseToughness: number;
  currentPower: number;
  currentToughness: number;
  controller: string;
  manaValue: number;
}

export interface LayerStepResult {
  layer: LayerNumber;
  name: string;
  crRule: string;
  effectsApplied: { source: string; description: string; timestamp: number }[];
  snapshot: PermanentState;
  explanation: string;
}

export function evaluateLayers(
  initialPermanent: PermanentState,
  effects: LayerEffect[]
): { finalState: PermanentState; steps: LayerStepResult[] } {
  // Deep clone initial state
  let current: PermanentState = {
    ...initialPermanent,
    cardTypes: [...initialPermanent.cardTypes],
    subtypes: [...initialPermanent.subtypes],
    colors: [...initialPermanent.colors],
    abilities: [...initialPermanent.abilities],
    currentPower: initialPermanent.basePower,
    currentToughness: initialPermanent.baseToughness,
  };

  const steps: LayerStepResult[] = [];

  const layerDefs: { layer: LayerNumber; name: string; rule: string }[] = [
    { layer: '1', name: 'Copy & Mutate Effects', rule: 'CR 613.1a' },
    { layer: '2', name: 'Control-Changing Effects', rule: 'CR 613.1b' },
    { layer: '3', name: 'Text-Changing Effects', rule: 'CR 613.1c' },
    { layer: '4', name: 'Type-Changing Effects', rule: 'CR 613.1d' },
    { layer: '5', name: 'Color-Changing Effects', rule: 'CR 613.1e' },
    { layer: '6', name: 'Ability Adding & Removing Effects', rule: 'CR 613.1f' },
    { layer: '7a', name: 'Characteristic-Defining Abilities (CDA)', rule: 'CR 613.4a' },
    { layer: '7b', name: 'Setting Base Power & Toughness', rule: 'CR 613.4b' },
    { layer: '7c', name: 'Modifying Power & Toughness (+X/+X, -X/-X)', rule: 'CR 613.4c' },
    { layer: '7d', name: 'Counters Affecting Power & Toughness', rule: 'CR 613.4d' },
    { layer: '7e', name: 'Switching Power & Toughness', rule: 'CR 613.4e' },
  ];

  for (const def of layerDefs) {
    // Filter effects for this layer and sort by timestamp
    const layerEffects = effects
      .filter((e) => e.layer === def.layer)
      .sort((a, b) => a.timestamp - b.timestamp);

    const appliedInfo: { source: string; description: string; timestamp: number }[] = [];
    let layerNote = 'No effects apply in this layer.';

    if (layerEffects.length > 0) {
      for (const eff of layerEffects) {
        appliedInfo.push({
          source: eff.source,
          description: eff.description,
          timestamp: eff.timestamp,
        });

        // Apply effect logic
        switch (eff.layer) {
          case '1': // Copy
            if (eff.value?.name) current.name = eff.value.name;
            if (eff.value?.basePower !== undefined) current.basePower = eff.value.basePower;
            if (eff.value?.baseToughness !== undefined) current.baseToughness = eff.value.baseToughness;
            break;

          case '2': // Control
            if (eff.value?.controller) current.controller = eff.value.controller;
            break;

          case '3': // Text
            // Text alterations
            break;

          case '4': // Type
            if (eff.value?.addTypes) {
              current.cardTypes = Array.from(new Set([...current.cardTypes, ...eff.value.addTypes]));
            }
            if (eff.value?.addSubtypes) {
              current.subtypes = Array.from(new Set([...current.subtypes, ...eff.value.addSubtypes]));
            }
            if (eff.value?.setLandType) {
              // e.g. Blood Moon setting to Mountain: loses other land subtypes, retains card types
              current.subtypes = [eff.value.setLandType];
            }
            break;

          case '5': // Color
            if (eff.value?.setColors) {
              current.colors = [...eff.value.setColors];
            }
            break;

          case '6': // Ability
            if (eff.effectType === 'ability_remove') {
              current.abilities = [];
            } else if (eff.effectType === 'ability_add' && eff.value?.ability) {
              if (!current.abilities.includes(eff.value.ability)) {
                current.abilities.push(eff.value.ability);
              }
            }
            break;

          case '7a': // CDA
            if (eff.value?.cdaPower !== undefined) {
              current.currentPower = eff.value.cdaPower;
              current.currentToughness = eff.value.cdaToughness;
            }
            break;

          case '7b': // Set base P/T
            if (eff.value?.power !== undefined) {
              current.currentPower = eff.value.power;
              current.currentToughness = eff.value.toughness;
            }
            break;

          case '7c': // Mod P/T
            if (eff.value?.powerDelta !== undefined) {
              current.currentPower += eff.value.powerDelta;
              current.currentToughness += eff.value.toughnessDelta;
            }
            break;

          case '7d': // Counters
            if (eff.value?.plusCounters !== undefined) {
              current.currentPower += eff.value.plusCounters;
              current.currentToughness += eff.value.plusCounters;
            }
            if (eff.value?.minusCounters !== undefined) {
              current.currentPower -= eff.value.minusCounters;
              current.currentToughness -= eff.value.minusCounters;
            }
            break;

          case '7e': // Switch P/T
            const temp = current.currentPower;
            current.currentPower = current.currentToughness;
            current.currentToughness = temp;
            break;
        }
      }
      layerNote = `Applied ${layerEffects.length} effect(s) in timestamp order.`;
    }

    steps.push({
      layer: def.layer,
      name: def.name,
      crRule: def.rule,
      effectsApplied: appliedInfo,
      snapshot: {
        ...current,
        cardTypes: [...current.cardTypes],
        subtypes: [...current.subtypes],
        colors: [...current.colors],
        abilities: [...current.abilities],
      },
      explanation: layerNote,
    });
  }

  return { finalState: current, steps };
}
