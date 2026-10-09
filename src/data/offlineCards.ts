export interface CardData {
  id: string;
  name: string;
  mana_cost?: string;
  type_line: string;
  oracle_text: string;
  power?: string;
  toughness?: string;
  rulings?: { date: string; comment: string }[];
  image_uris?: { normal: string; small: string };
  colors?: string[];
}

export const OFFLINE_CARDS_DATABASE: CardData[] = [
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    mana_cost: '{2}{R}',
    type_line: 'Enchantment',
    oracle_text: 'Nonbasic lands are Mountains.',
    colors: ['R'],
    rulings: [
      { date: '2021-06-18', comment: "Nonbasic lands lose any other land types and abilities they had. They gain the Mountain land type and the ability to tap for {R}." },
      { date: '2021-06-18', comment: "Blood Moon's effect applies in Layer 4 (type changing). It affects Urza's Saga, causing it to become a Mountain with 0 chapter abilities and be sacrificed." },
    ],
  },
  {
    id: 'urzas-saga',
    name: "Urza's Saga",
    type_line: "Enchantment Land — Urza's Saga",
    oracle_text: '(As this Saga enters and after your draw step, add a lore counter.)\nI — Urza\'s Saga gains "{T}: Add {C}."\nII — Urza\'s Saga gains "{2}, {T}: Create a 0/0 colorless Construct artifact creature token with \'This creature gets +1/+1 for each artifact you control.\' "\nIII — Search your library for an artifact card with mana cost {0} or {1}, put it onto the battlefield, then shuffle.',
    rulings: [
      { date: '2021-06-18', comment: "If Urza's Saga loses all chapter abilities (such as from Blood Moon), its final chapter number is 0. It is sacrificed as a state-based action." },
    ],
  },
  {
    id: 'humility',
    name: 'Humility',
    mana_cost: '{2}{W}{W}',
    type_line: 'Enchantment',
    oracle_text: 'All creatures lose all abilities and have base power and toughness 1/1.',
    colors: ['W'],
    rulings: [
      { date: '2004-10-04', comment: "Applies in Layer 6 (ability removal) and Layer 7b (setting base power and toughness)." },
      { date: '2004-10-04', comment: "When interacting with Opalescence, timestamps in Layer 7b decide power and toughness." },
    ],
  },
  {
    id: 'opalescence',
    name: 'Opalescence',
    mana_cost: '{2}{W}{W}',
    type_line: 'Enchantment',
    oracle_text: 'Each other non-Aura enchantment is a creature in addition to its other types and has base power and base toughness each equal to its mana value.',
    colors: ['W'],
    rulings: [
      { date: '2004-10-04', comment: "Applies in Layer 4 (type changing) and Layer 7b (setting base power and toughness)." },
    ],
  },
  {
    id: 'dress-down',
    name: 'Dress Down',
    mana_cost: '{1}{U}',
    type_line: 'Enchantment',
    oracle_text: 'Flash\nWhen Dress Down enters, draw a card.\nAt the beginning of the end step, sacrifice Dress Down.\nCreatures lose all abilities.',
    colors: ['U'],
    rulings: [
      { date: '2021-06-18', comment: "Applies in Layer 6. Removes all abilities from creatures, including abilities that modify their power and toughness in Layer 7c." },
      { date: '2021-06-18', comment: "Death's Shadow becomes a 13/13 while Dress Down is on the battlefield." },
    ],
  },
  {
    id: 'deaths-shadow',
    name: "Death's Shadow",
    mana_cost: '{B}',
    type_line: 'Creature — Avatar',
    oracle_text: "Death's Shadow gets -X/-X, where X is your life total.",
    power: '13',
    toughness: '13',
    colors: ['B'],
    rulings: [
      { date: '2020-08-07', comment: "This is a static ability modifying power and toughness in Layer 7c. If Death's Shadow loses its abilities (e.g. Dress Down), it remains a base 13/13." },
    ],
  },
  {
    id: 'dryad-of-the-ilysian-grove',
    name: 'Dryad of the Ilysian Grove',
    mana_cost: '{2}{G}',
    type_line: 'Enchantment Creature — Nymph Dryad',
    oracle_text: 'You may play an additional land on each of your turns.\nLands you control are every basic land type in addition to their other types.',
    power: '2',
    toughness: '4',
    colors: ['G'],
    rulings: [
      { date: '2020-01-24', comment: "Lands gain Plains, Island, Swamp, Mountain, and Forest subtypes. Timestamps dictate whether Blood Moon or Dryad's type effect overrides on nonbasics." },
    ],
  },
  {
    id: 'doubling-season',
    name: 'Doubling Season',
    mana_cost: '{4}{G}',
    type_line: 'Enchantment',
    oracle_text: 'If an effect would create one or more tokens under your control, it creates twice that many of those tokens instead.\nIf an effect would put one or more counters on a permanent you control, it puts twice that many of those counters on that permanent instead.',
    colors: ['G'],
    rulings: [
      { date: '2020-08-07', comment: "Planeswalkers enter the battlefield with twice the counters (an effect). However, activating a + loyalty ability is a cost, so it is not doubled." },
    ],
  },
  {
    id: 'teferi-time-raveler',
    name: 'Teferi, Time Raveler',
    mana_cost: '{1}{W}{U}',
    type_line: 'Legendary Planeswalker — Teferi',
    oracle_text: 'Each opponent can cast spells only any time they could cast a sorcery.\n+1: Until your next turn, you may cast sorcery spells as though they had flash.\n-3: Return up to one target artifact, creature, or enchantment to its owner\'s hand. Draw a card.',
    colors: ['W', 'U'],
    rulings: [
      { date: '2019-05-03', comment: "Completely stops opponents from casting cards via Cascade, Suspend, or during combat or upkeep because the stack is not empty or it is not their main phase." },
    ],
  },
  {
    id: 'chains-of-mephistopheles',
    name: 'Chains of Mephistopheles',
    mana_cost: '{1}{B}',
    type_line: 'Enchantment',
    oracle_text: 'If a player would draw a card except the first one they draw in each of their draw steps, that player discards a card instead. If the player discards a card this way, they draw a card. If the player doesn\'t discard a card this way, they mill a card.',
    colors: ['B'],
    rulings: [
      { date: '2004-10-04', comment: "A replacement effect. Each draw from effects like Brainstorm is replaced one by one." },
    ],
  },
  {
    id: 'painters-servant',
    name: "Painter's Servant",
    mana_cost: '{2}',
    type_line: 'Artifact Creature — Scarecrow',
    oracle_text: 'As Painter\'s Servant enters, choose a color.\nAll cards that aren\'t on the battlefield, spells, and permanents are the chosen color in addition to their other colors.',
    power: '1',
    toughness: '3',
    rulings: [
      { date: '2008-05-01', comment: "Applies in Layer 5 (color changing). Interacts with Grindstone to mill entire libraries." },
    ],
  },
  {
    id: 'grindstone',
    name: 'Grindstone',
    mana_cost: '{1}',
    type_line: 'Artifact',
    oracle_text: '{3}, {T}: Target player mills two cards. If two cards that share a color were milled this way, repeat this process.',
    rulings: [
      { date: '2008-05-01', comment: "With Painter's Servant out, every card in the library shares the chosen color, repeating until library is empty." },
    ],
  },
  {
    id: 'panglacial-wurm',
    name: 'Panglacial Wurm',
    mana_cost: '{5}{G}{G}',
    type_line: 'Creature — Wurm',
    oracle_text: 'Trample\nWhile you\'re searching your library, you may cast Panglacial Wurm from your library.',
    power: '9',
    toughness: '5',
    colors: ['G'],
    rulings: [
      { date: '2021-03-19', comment: "You cast it in the middle of resolving the search effect. You may activate mana abilities. If a mana ability draws a card (e.g. Selvala or Chromatic Sphere), that card is drawn from the currently searched library." },
    ],
  },
  {
    id: 'thassas-oracle',
    name: "Thassa's Oracle",
    mana_cost: '{U}{U}',
    type_line: 'Creature — Merfolk Wizard',
    oracle_text: 'When Thassa\'s Oracle enters, look at the top X cards of your library, where X is your devotion to blue. Put up to one of them on top of your library and the rest on the bottom in a random order. If X is greater than or equal to the number of cards in your library, you win the game.',
    power: '1',
    toughness: '3',
    colors: ['U'],
    rulings: [
      { date: '2020-01-24', comment: "Checked on resolution of the trigger. Even if your devotion is 0, if your library has 0 cards, you win the game." },
    ],
  },
  {
    id: 'blood-artist',
    name: 'Blood Artist',
    mana_cost: '{1}{B}',
    type_line: 'Creature — Vampire',
    oracle_text: 'Whenever Blood Artist or another creature dies, target player loses 1 life and you gain 1 life.',
    power: '0',
    toughness: '1',
    colors: ['B'],
  },
  {
    id: 'orcish-bowmasters',
    name: 'Orcish Bowmasters',
    mana_cost: '{1}{B}',
    type_line: 'Creature — Orc Archer',
    oracle_text: 'Flash\nWhen Orcish Bowmasters enters and whenever an opponent draws a card except the first one they draw in each of their draw steps, Orcish Bowmasters deals 1 damage to any target and you amass Orcs 1.',
    power: '1',
    toughness: '1',
    colors: ['B'],
  },
  {
    id: 'the-one-ring',
    name: 'The One Ring',
    mana_cost: '{4}',
    type_line: 'Legendary Artifact',
    oracle_text: 'Indestructible\nWhen The One Ring enters, if you cast it, you gain protection from everything until your next turn.\nAt the beginning of your upkeep, you lose 1 life for each burden counter on The One Ring.\n{T}: Put a burden counter on The One Ring, then draw a card for each burden counter on The One Ring.',
  },
  {
    id: 'rest-in-peace',
    name: 'Rest in Peace',
    mana_cost: '{1}{W}',
    type_line: 'Enchantment',
    oracle_text: 'When Rest in Peace enters, exile all cards from all graveyards.\nIf a card or token would be put into a graveyard from anywhere, exile it instead.',
    colors: ['W'],
    rulings: [
      { date: '2016-06-08', comment: "A replacement effect (CR 614). Creatures that would die are exiled instead, meaning 'dies' triggered abilities do not trigger." },
    ],
  },
  {
    id: 'dauthi-voidwalker',
    name: 'Dauthi Voidwalker',
    mana_cost: '{B}{B}',
    type_line: 'Creature — Dauthi Rogue',
    oracle_text: 'Shadow\nIf a card would be put into an opponent\'s graveyard from anywhere, exile it with a void counter on it instead.\n{T}, Sacrifice Dauthi Voidwalker: Choose an exiled card an opponent owns with a void counter on it. You may play it this turn without paying its mana cost.',
    power: '3',
    toughness: '2',
    colors: ['B'],
  },
];
