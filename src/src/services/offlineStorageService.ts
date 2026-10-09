import { CardData, OFFLINE_CARDS_DATABASE } from '../data/offlineCards';
import { RuleEntry, MTG_RULES_CORPUS } from '../data/rulesCorpus';

const DB_NAME = 'judge_gemma_mtg_db';
const DB_VERSION = 1;
const STORE_CARDS = 'cards';
const STORE_RULES = 'rules';
const STORE_META = 'metadata';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;

      if (!db.objectStoreNames.contains(STORE_CARDS)) {
        const cardStore = db.createObjectStore(STORE_CARDS, { keyPath: 'nameLower' });
        cardStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_RULES)) {
        const ruleStore = db.createObjectStore(STORE_RULES, { keyPath: 'number' });
        ruleStore.createIndex('title', 'title', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Seed the default offline cards and rules if DB is fresh
export async function initializeOfflineDatabase(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_CARDS, STORE_RULES, STORE_META], 'readwrite');
    const cardStore = tx.objectStore(STORE_CARDS);
    const ruleStore = tx.objectStore(STORE_RULES);
    const metaStore = tx.objectStore(STORE_META);

    // Seed offline cards
    for (const card of OFFLINE_CARDS_DATABASE) {
      cardStore.put({
        ...card,
        nameLower: card.name.toLowerCase().trim(),
      });
    }

    // Seed offline rules
    for (const rule of MTG_RULES_CORPUS) {
      ruleStore.put(rule);
    }

    metaStore.put({
      key: 'stats',
      cardCount: OFFLINE_CARDS_DATABASE.length,
      ruleCount: MTG_RULES_CORPUS.length,
      lastUpdated: new Date().toISOString(),
      source: 'Default Pre-cached Database',
    });

    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  } catch (err) {
    console.warn('Could not initialize IndexedDB offline cache:', err);
  }
}

// Search a card in offline storage
export async function getCardFromIndexedDB(cardName: string): Promise<CardData | null> {
  const cleanName = cardName.toLowerCase().trim();
  if (!cleanName) return null;

  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_CARDS], 'readonly');
    const cardStore = tx.objectStore(STORE_CARDS);

    // Exact match
    const exactReq = cardStore.get(cleanName);
    const exactResult = await new Promise<any>((resolve) => {
      exactReq.onsuccess = () => resolve(exactReq.result);
      exactReq.onerror = () => resolve(null);
    });

    if (exactResult) return exactResult;

    // Fuzzy scan
    const allCardsReq = cardStore.getAll();
    const allCards = await new Promise<any[]>((resolve) => {
      allCardsReq.onsuccess = () => resolve(allCardsReq.result || []);
      allCardsReq.onerror = () => resolve([]);
    });

    const match = allCards.find(
      (c) => c.nameLower === cleanName || c.nameLower.includes(cleanName) || cleanName.includes(c.nameLower)
    );

    return match || null;
  } catch {
    return null;
  }
}

// Search multiple cards matching query
export async function searchCardsInIndexedDB(query: string, limit = 20): Promise<CardData[]> {
  const clean = query.toLowerCase().trim();
  if (!clean) return [];

  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_CARDS], 'readonly');
    const cardStore = tx.objectStore(STORE_CARDS);
    const allCardsReq = cardStore.getAll();

    const allCards = await new Promise<any[]>((resolve) => {
      allCardsReq.onsuccess = () => resolve(allCardsReq.result || []);
      allCardsReq.onerror = () => resolve([]);
    });

    return allCards
      .filter((c) => c.nameLower.includes(clean))
      .slice(0, limit);
  } catch {
    return [];
  }
}

// Get database status
export async function getOfflineDatabaseStats(): Promise<{
  cardCount: number;
  ruleCount: number;
  lastUpdated?: string;
  source?: string;
}> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_CARDS, STORE_RULES, STORE_META], 'readonly');
    const cardStore = tx.objectStore(STORE_CARDS);
    const ruleStore = tx.objectStore(STORE_RULES);
    const metaStore = tx.objectStore(STORE_META);

    const cardCountReq = cardStore.count();
    const ruleCountReq = ruleStore.count();
    const metaReq = metaStore.get('stats');

    const [cardCount, ruleCount, meta] = await Promise.all([
      new Promise<number>((res) => (cardCountReq.onsuccess = () => res(cardCountReq.result))),
      new Promise<number>((res) => (ruleCountReq.onsuccess = () => res(ruleCountReq.result))),
      new Promise<any>((res) => (metaReq.onsuccess = () => res(metaReq.result))),
    ]);

    return {
      cardCount: Math.max(cardCount, OFFLINE_CARDS_DATABASE.length),
      ruleCount: Math.max(ruleCount, MTG_RULES_CORPUS.length),
      lastUpdated: meta?.lastUpdated || new Date().toISOString(),
      source: meta?.source || 'Pre-loaded Rules & Card Cache',
    };
  } catch {
    return {
      cardCount: OFFLINE_CARDS_DATABASE.length,
      ruleCount: MTG_RULES_CORPUS.length,
      lastUpdated: new Date().toISOString(),
      source: 'In-Memory Fallback',
    };
  }
}

// Import MTGJSON format:
// Handles MTGJSON AllPrintings: {"meta": {...}, "data": { "10E": { "cards": [...] } }}
// Also handles AtomicCards: {"data": { "CardName": [{ text, manaCost, ... }] }}
// Also handles array of cards: [ { name, text, ... } ]
export async function importMTGJSONData(
  parsedJson: any,
  onProgress?: (progress: number, count: number) => void
): Promise<{ importedCount: number; setNames: string[] }> {
  const cardsToStore: CardData[] = [];
  const setNames: string[] = [];

  // Format 1: MTGJSON AllPrintings { data: { "10E": { cards: [...] }, ... } }
  if (parsedJson.data && typeof parsedJson.data === 'object') {
    const sets = Object.keys(parsedJson.data);
    for (const setKey of sets) {
      const setObj = parsedJson.data[setKey];
      if (setObj && Array.isArray(setObj.cards)) {
        setNames.push(setObj.name || setKey);
        for (const c of setObj.cards) {
          if (!c.name) continue;
          cardsToStore.push({
            id: c.uuid || c.id || `${setKey}-${c.number || Math.random()}`,
            name: c.name,
            mana_cost: c.manaCost || (c.manaValue ? `{${c.manaValue}}` : undefined),
            type_line: c.type || (c.types ? c.types.join(' ') : 'Card'),
            oracle_text: c.text || c.oracle_text || '',
            power: c.power !== undefined ? String(c.power) : undefined,
            toughness: c.toughness !== undefined ? String(c.toughness) : undefined,
            colors: c.colors || [],
            rulings: c.rulings?.map((r: any) => ({
              date: r.date || '',
              comment: r.text || r.comment || '',
            })),
          });
        }
      } else if (Array.isArray(setObj)) {
        // Format 2: AtomicCards { data: { "Card Name": [{ name, text, ... }] } }
        const c = setObj[0];
        if (c && c.name) {
          cardsToStore.push({
            id: c.identifiers?.scryfallId || c.uuid || c.name,
            name: c.name,
            mana_cost: c.manaCost,
            type_line: c.type || (c.types ? c.types.join(' ') : 'Card'),
            oracle_text: c.text || '',
            power: c.power !== undefined ? String(c.power) : undefined,
            toughness: c.toughness !== undefined ? String(c.toughness) : undefined,
            colors: c.colors || [],
            rulings: c.rulings?.map((r: any) => ({
              date: r.date || '',
              comment: r.text || r.comment || '',
            })),
          });
        }
      }
    }
  } else if (Array.isArray(parsedJson)) {
    // Format 3: Array of cards
    for (const c of parsedJson) {
      if (c && c.name) {
        cardsToStore.push({
          id: c.id || c.name,
          name: c.name,
          mana_cost: c.mana_cost || c.manaCost,
          type_line: c.type_line || c.type || 'Card',
          oracle_text: c.oracle_text || c.text || '',
          power: c.power !== undefined ? String(c.power) : undefined,
          toughness: c.toughness !== undefined ? String(c.toughness) : undefined,
          colors: c.colors || [],
        });
      }
    }
  }

  if (cardsToStore.length === 0) {
    throw new Error('No recognized MTG cards found in the JSON file. Ensure it is a valid MTGJSON format.');
  }

  // Deduplicate by card name (keep latest/richest)
  const dedupedMap = new Map<string, CardData>();
  for (const c of cardsToStore) {
    const key = c.name.toLowerCase().trim();
    if (!dedupedMap.has(key) || (c.rulings && c.rulings.length > 0)) {
      dedupedMap.set(key, c);
    }
  }

  const finalCards = Array.from(dedupedMap.values());
  const db = await openDatabase();

  // Batch insert into IndexedDB in chunks of 500
  const CHUNK_SIZE = 500;
  let processed = 0;

  for (let i = 0; i < finalCards.length; i += CHUNK_SIZE) {
    const chunk = finalCards.slice(i, i + CHUNK_SIZE);
    const tx = db.transaction([STORE_CARDS], 'readwrite');
    const store = tx.objectStore(STORE_CARDS);

    for (const card of chunk) {
      store.put({
        ...card,
        nameLower: card.name.toLowerCase().trim(),
      });
    }

    await new Promise((res) => (tx.oncomplete = res));
    processed += chunk.length;

    if (onProgress) {
      const pct = Math.round((processed / finalCards.length) * 100);
      onProgress(pct, processed);
    }
  }

  // Update metadata
  const metaTx = db.transaction([STORE_META], 'readwrite');
  metaTx.objectStore(STORE_META).put({
    key: 'stats',
    cardCount: finalCards.length,
    ruleCount: MTG_RULES_CORPUS.length,
    lastUpdated: new Date().toISOString(),
    source: `MTGJSON Import (${finalCards.length} cards, ${setNames.length} sets)`,
  });
  await new Promise((res) => (metaTx.oncomplete = res));

  return { importedCount: finalCards.length, setNames };
}

// Import Complete MTG Rulebook text or JSON
export async function importComprehensiveRulebook(
  rulebookText: string
): Promise<number> {
  const db = await openDatabase();
  const tx = db.transaction([STORE_RULES], 'readwrite');
  const store = tx.objectStore(STORE_RULES);

  let added = 0;

  // Split into lines/paragraphs and parse sections (e.g. 100.1, 613.1d, etc.)
  const lines = rulebookText.split('\n');
  let currentRule: RuleEntry | null = null;

  for (const line of lines) {
    const ruleMatch = line.match(/^(\d{3}\.\d+[a-z]?)\.?\s+(.+)$/);
    if (ruleMatch) {
      const num = ruleMatch[1];
      const text = ruleMatch[2];
      store.put({
        number: num,
        title: `Comprehensive Rule ${num}`,
        category: 'Imported Rulebook',
        summary: text,
      });
      added++;
    }
  }

  await new Promise((res) => (tx.oncomplete = res));
  return added;
}
