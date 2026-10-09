export interface RuleEntry {
  number: string;
  title: string;
  category: string;
  summary: string;
  fullText?: string;
  keywords?: string[];
  subrules?: { number: string; text: string }[];
}

export const MTG_RULES_CORPUS: RuleEntry[] = [
  {
    number: '101.4',
    title: 'APNAP Order (Active Player, Non-Active Player)',
    category: 'General Principles',
    summary: 'When simultaneous choices or triggers occur, the active player makes choices/puts triggers on the stack first, followed by non-active players in turn order. The last trigger put on the stack resolves first.',
    keywords: ['apnap', 'active player', 'simultaneous', 'turn order', 'triggers', 'priority'],
    subrules: [
      { number: '101.4a', text: 'If multiple players are required to make simultaneous choices, the active player chooses first, then each other player in turn order does so.' },
      { number: '101.4c', text: 'If multiple triggered abilities trigger simultaneously, the active player puts their abilities on the stack in any order, then each other player in turn order does the same. Triggers placed last resolve first.' },
    ],
  },
  {
    number: '117',
    title: 'Timing and Priority',
    category: 'Turn Structure & Priority',
    summary: 'Rules governing when players can cast spells, activate abilities, and take special actions. Priority passes in turn order. All players must pass priority in succession on an empty stack for the step or phase to end.',
    keywords: ['priority', 'timing', 'instant', 'sorcery', 'pass priority', 'empty stack'],
    subrules: [
      { number: '117.1a', text: 'A player may cast an instant spell whenever they have priority. A player may cast a non-instant spell during a main phase on an empty stack if they are the active player.' },
      { number: '117.3b', text: 'The active player receives priority at the beginning of most steps and phases, and after a spell or ability resolves.' },
      { number: '117.4', text: 'If all players pass in succession (that is, if all players pass without taking any actions in between once each has received priority), the top object on the stack resolves, or the step/phase ends.' },
    ],
  },
  {
    number: '405',
    title: 'The Stack',
    category: 'Zones',
    summary: 'The zone where spells, activated abilities, and triggered abilities wait to resolve. Objects resolve in Last In, First Out (LIFO) order.',
    keywords: ['stack', 'lifo', 'resolve', 'counterspell', 'zone', 'spells'],
    subrules: [
      { number: '405.1', text: 'When a spell is cast, the physical card is put onto the stack. When an ability is activated or triggers, it goes on top of the stack without a physical card.' },
      { number: '405.5', text: 'When all players pass priority in succession, the top (most recently added) spell or ability on the stack resolves.' },
    ],
  },
  {
    number: '601',
    title: 'Casting Spells',
    category: 'Spells & Abilities',
    summary: 'The 8-step process of casting a spell: announce and move to stack (601.2a), choose modes (601.2b), choose targets (601.2c), choose division (601.2d), determine total cost (601.2f), activate mana abilities (601.2g), pay total cost (601.2h).',
    keywords: ['casting', 'targets', 'modes', 'costs', 'mana abilities', 'trinisphere'],
    subrules: [
      { number: '601.2f', text: 'Total cost calculation: Base mana cost or alternate cost + additional costs/cost increasers - cost reducers, and finally Trinisphere/minimum cost effects.' },
      { number: '601.2h', text: 'Once the total cost is determined, the player may activate mana abilities and pays all costs in any order. The spell becomes cast.' },
    ],
  },
  {
    number: '603',
    title: 'Handling Triggered Abilities',
    category: 'Spells & Abilities',
    summary: 'Triggered abilities have a trigger condition starting with "when", "whenever", or "at". They trigger when the event occurs and wait to be put on the stack the next time a player would receive priority.',
    keywords: ['trigger', 'triggered ability', 'when', 'whenever', 'at', 'intervening if'],
    subrules: [
      { number: '603.3', text: 'Once an ability has triggered, its controller puts it on the top of the stack the next time any player would receive priority.' },
      { number: '603.4', text: 'Intervening "if" clause: The condition is checked both at the moment the event occurs and again upon resolution. If false at resolution, the ability does nothing and is removed from the stack.' },
    ],
  },
  {
    number: '605',
    title: 'Mana Abilities',
    category: 'Spells & Abilities',
    summary: 'Abilities that produce mana, do not target, and are not loyalty abilities. Activated mana abilities do not use the stack and resolve immediately without passing priority.',
    keywords: ['mana ability', 'tap for mana', 'no stack', 'instant speed mana'],
    subrules: [
      { number: '605.1a', text: 'An activated ability is a mana ability if it doesn’t require a target, could put mana into a player’s mana pool when it resolves, and is not a loyalty ability.' },
      { number: '605.3b', text: 'An activated mana ability doesn’t go on the stack, so it can’t be targeted, countered, or responded to. Rather, it resolves immediately after it is activated.' },
    ],
  },
  {
    number: '613',
    title: 'The Layer System (Interaction of Continuous Effects)',
    category: 'Continuous Effects & Layers',
    summary: 'Continuous effects that modify the characteristics of game objects apply in a strict hierarchical order of 7 layers, followed by timestamps and dependencies within each layer.',
    keywords: ['layers', 'continuous effects', 'blood moon', 'humility', 'opalescence', 'timestamps', 'dependencies', 'dress down'],
    subrules: [
      { number: '613.1a', text: 'Layer 1: Copy effects and Mutate abilities apply. (Includes token copies, Clone, mutate stacks).' },
      { number: '613.1b', text: 'Layer 2: Control-changing effects apply. (e.g. Act of Treason, Control Magic).' },
      { number: '613.1c', text: 'Layer 3: Text-changing effects apply. (e.g. Mind Bend, Magical Hack).' },
      { number: '613.1d', text: 'Layer 4: Type-changing effects apply. (e.g. Blood Moon, Dryad of the Ilysian Grove, Urza\'s Saga, Conspiracy).' },
      { number: '613.1e', text: 'Layer 5: Color-changing effects apply. (e.g. Painter\'s Servant, Darkest Hour).' },
      { number: '613.1f', text: 'Layer 6: Ability-adding effects, ability-removing effects, and effects that say an object can’t have an ability apply. (e.g. Humility, Dress Down, Archetype of Courage).' },
      { number: '613.1g', text: 'Layer 7: Power- and/or toughness-modifying effects apply in 5 sublayers (7a to 7e).' },
      { number: '613.4a', text: 'Layer 7a: Characteristic-defining abilities (CDAs) that define base power and/or toughness apply. (e.g. Tarmogoyf, Maro).' },
      { number: '613.4b', text: 'Layer 7b: Effects that set base power and/or toughness apply. (e.g. Humility sets 1/1, Godhead of Awe, Scale Up).' },
      { number: '613.4c', text: 'Layer 7c: Effects that modify power and/or toughness without setting them apply. (e.g. Giant Growth +3/+3, Anthem +1/+1 static buffs).' },
      { number: '613.4d', text: 'Layer 7d: Power and/or toughness changes from counters apply. (+1/+1 counters, -1/-1 counters).' },
      { number: '613.4e', text: 'Layer 7e: Effects that switch a creature’s power and toughness apply. (e.g. Inside Out, Wandering Fumarole).' },
      { number: '613.7', text: 'Within a layer or sublayer, earlier timestamp effects apply before later timestamp effects, unless a dependency exists.' },
      { number: '613.8', text: 'Dependency: An effect is dependent on another if applying the first changes the text, existence, or what the second applies to. The independent effect applies first regardless of timestamp.' },
    ],
  },
  {
    number: '614',
    title: 'Replacement Effects',
    category: 'Continuous Effects & Layers',
    summary: 'Replacement effects modify how an event occurs rather than letting it happen normally. They use words such as "instead", "as [event] occurs", "with", or "enters with". If multiple replacement effects apply to an event, the affected player or controller of the affected object chooses the order.',
    keywords: ['replacement effect', 'instead', 'doubling season', 'rest in peace', 'dauthi voidwalker', 'affected player'],
    subrules: [
      { number: '614.1a', text: 'Effects that use the word "instead" are replacement effects. Most replacement effects, if applied, completely or partially prevent an event and substitute a different event.' },
      { number: '614.12', text: 'Some replacement effects that apply to an object entering the battlefield inspect what the permanent would look like upon entering (e.g. clone copies, enters tapped, enters with counters).' },
      { number: '614.16', text: 'Each replacement effect can only apply once to a single event or to an event that was generated as a result of that event.' },
      { number: '616.1', text: 'If two or more replacement and/or prevention effects attempt to modify how an event affects an object or player, the affected player (or the controller of the affected object) chooses one to apply first.' },
    ],
  },
  {
    number: '704',
    title: 'State-Based Actions (SBAs)',
    category: 'Game Loop & Cleanup',
    summary: 'Game conditions checked and performed automatically whenever any player would receive priority. They do not use the stack and happen simultaneously.',
    keywords: ['sba', 'state-based action', 'lethal damage', 'legend rule', 'saga sacrifice', '0 toughness', 'annihilate counters'],
    subrules: [
      { number: '704.5a', text: 'If a player has 0 or less life, that player loses the game.' },
      { number: '704.5f', text: 'If a creature has toughness 0 or less, it is put into its owner’s graveyard. Regeneration cannot replace this.' },
      { number: '704.5g', text: 'If a creature has lethal damage marked on it and does not have indestructible, it is destroyed.' },
      { number: '704.5j', text: 'Legend rule: If a player controls two or more legendary permanents with the same name, that player chooses one and puts the rest into their owners’ graveyards.' },
      { number: '704.5q', text: 'Counters: If a permanent has both a +1/+1 counter and a -1/-1 counter on it, N of each are removed as a state-based action until only one type remains.' },
      { number: '704.5s', text: 'Saga sacrifice: If a Saga permanent has a number of lore counters greater than or equal to its final chapter number and isn’t the source of a chapter ability that has triggered but not yet left the stack, its controller sacrifices it.' },
    ],
  },
  {
    number: '702.16',
    title: 'Protection',
    category: 'Keyword Abilities',
    summary: 'Protection from [quality] means DEBT: Damage cannot be dealt, Enchant/Equip/Fortify cannot attach, Block cannot occur, Target cannot be chosen by sources with that quality.',
    keywords: ['protection', 'debt', 'damage', 'equip', 'block', 'target', 'true-name nemesis'],
  },
  {
    number: '702.2',
    title: 'Deathtouch & Trample Interaction',
    category: 'Keyword Abilities',
    summary: 'Any amount of damage dealt by a source with deathtouch is lethal damage. When combined with Trample, the attacking creature only needs to assign 1 point of damage to each blocking creature, and can trample the rest to the defending player or planeswalker.',
    keywords: ['deathtouch', 'trample', 'combat damage', 'lethal damage assignment'],
  },
];

export const GLOSSARY_TERMS: { term: string; definition: string; rule: string }[] = [
  { term: 'APNAP Order', definition: 'Active Player, Non-Active Player order. Dictates how simultaneous triggers and choices are ordered in turn sequence.', rule: 'CR 101.4' },
  { term: 'CDA (Characteristic-Defining Ability)', definition: 'An ability that defines an object’s colors, subtypes, power, or toughness. Applies in Layer 7a before all other P/T effects, everywhere including outside the battlefield.', rule: 'CR 604.3' },
  { term: 'Continuous Effect', definition: 'An effect that modifies characteristics, rules, or control over a span of time or indefinitely, evaluated through the 7 layers.', rule: 'CR 611' },
  { term: 'Dependency', definition: 'A relationship where applying one continuous effect changes what another effect applies to, or changes the existence or text of that second effect.', rule: 'CR 613.8' },
  { term: 'Fizzle', definition: 'Informal slang for a spell or ability that is removed from the stack without resolving because all of its targets have become illegal.', rule: 'CR 608.2b' },
  { term: 'Intervening "If" Clause', definition: 'A condition written in the form "When/Whenever/At [trigger], if [condition], [effect]". Checked both at trigger time and resolution.', rule: 'CR 603.4' },
  { term: 'Last Known Information (LKI)', definition: 'Information about an object’s characteristics as it last existed in a zone before leaving or moving.', rule: 'CR 608.2b' },
  { term: 'Priority', definition: 'The system that determines which player is allowed to cast spells, activate abilities, or take special actions at any given time.', rule: 'CR 117' },
  { term: 'Replacement Effect', definition: 'An effect that modifies an event as it happens instead of letting it occur normally. Always contains "instead", "as", or "with".', rule: 'CR 614' },
  { term: 'State-Based Action (SBA)', definition: 'Automatic game engine checks that clean up illegal board states (0 life, 0 toughness, legend rule, sagas) before priority is given.', rule: 'CR 704' },
  { term: 'Timestamp', definition: 'The chronological order in which permanents entered the battlefield or continuous effects were generated. Used as a tiebreaker within the same layer.', rule: 'CR 613.7' },
];
