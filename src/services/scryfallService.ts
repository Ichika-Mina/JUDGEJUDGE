import { CardData, OFFLINE_CARDS_DATABASE } from '../data/offlineCards';
import { getCardFromIndexedDB } from './offlineStorageService';

const STORAGE_CACHE_KEY = 'judge_gemma_cards_cache_v1';

function getLocalCache(): Record<string, CardData> {
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToLocalCache(card: CardData) {
  try {
    const cache = getLocalCache();
    cache[card.name.toLowerCase()] = card;
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save card to local cache', e);
  }
}

export async function searchCardByName(cardName: string): Promise<CardData | null> {
  const query = cardName.trim().toLowerCase();
  if (!query) return null;

  // 1. Check local cache
  const localCache = getLocalCache();
  if (localCache[query]) {
    return localCache[query];
  }

  // 2. Check offline preloaded database
  const offlineMatch = OFFLINE_CARDS_DATABASE.find(
    (c) => c.name.toLowerCase() === query || c.name.toLowerCase().includes(query)
  );
  if (offlineMatch) {
    return offlineMatch;
  }

  // 2b. Check IndexedDB imported card database
  try {
    const idbMatch = await getCardFromIndexedDB(query);
    if (idbMatch) {
      return idbMatch;
    }
  } catch {
    // continue
  }

  // 3. If online, fetch from Scryfall API
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    return null;
  }

  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();

    // Fetch official rulings if available
    let rulings: { date: string; comment: string }[] = [];
    if (data.rulings_uri) {
      try {
        const rRes = await fetch(data.rulings_uri);
        if (rRes.ok) {
          const rData = await rRes.json();
          if (rData.data) {
            rulings = rData.data.map((r: any) => ({
              date: r.published_at,
              comment: r.comment,
            }));
          }
        }
      } catch {
        // rulings optional
      }
    }

    const card: CardData = {
      id: data.id,
      name: data.name,
      mana_cost: data.mana_cost,
      type_line: data.type_line,
      oracle_text: data.oracle_text || '',
      power: data.power,
      toughness: data.toughness,
      colors: data.colors,
      image_uris: data.image_uris ? { normal: data.image_uris.normal, small: data.image_uris.small } : undefined,
      rulings,
    };

    saveToLocalCache(card);
    return card;
  } catch (err) {
    console.warn('Scryfall search failed, offline or network error', err);
    return null;
  }
}

export function getAllCachedCards(): CardData[] {
  const cache = getLocalCache();
  const cachedList = Object.values(cache);

  // Combine with offline DB
  const map = new Map<string, CardData>();
  OFFLINE_CARDS_DATABASE.forEach((c) => map.set(c.name.toLowerCase(), c));
  cachedList.forEach((c) => map.set(c.name.toLowerCase(), c));

  return Array.from(map.values());
}
