import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getApiBaseUrl } from '../utils/apiConfig';

export const DEFAULT_FUEL_PRICES = {
  gasoline: 76.25,
  diesel: 96.80,
  lpg: 40.90,
  source: 'Petrol Ofisi / Opet Resmi Pompa Fiyatları',
  lastUpdated: new Date().toISOString()
};

/**
 * Normalizes city names for lookup
 */
function normalizeCity(name) {
  if (!name) return 'ISTANBUL';
  const clean = name.trim().toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');
  return clean;
}

/**
 * Fetches latest fuel prices from backend API or Firestore cache
 */
export async function fetchLiveFuelPrices() {
  // 1. Try reading from Firestore cache first
  try {
    const docRef = doc(db, 'system_settings', 'fuel_prices');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.prices && data.prices.gasoline > 0) {
        return {
          gasoline: data.prices.gasoline,
          diesel: data.prices.diesel,
          lpg: data.prices.lpg,
          cities: data.cities || {},
          source: data.source || 'Petrol Ofisi Resmi Fiyatları',
          lastUpdated: data.lastUpdated || (data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString())
        };
      }
    }
  } catch (err) {
    console.warn('Firestore fuel_prices read warning:', err);
  }

  // 2. Fallback to API endpoint
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/fuel-prices`);
    if (res.ok) {
      const apiData = await res.json();
      if (apiData && apiData.prices && apiData.prices.gasoline > 0) {
        // Also save to Firestore so other clients can benefit
        try {
          const docRef = doc(db, 'system_settings', 'fuel_prices');
          await setDoc(docRef, {
            ...apiData,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {}

        return {
          gasoline: apiData.prices.gasoline,
          diesel: apiData.prices.diesel,
          lpg: apiData.prices.lpg,
          cities: apiData.cities || {},
          source: apiData.source || 'Petrol Ofisi Resmi Fiyatları',
          lastUpdated: apiData.lastUpdated || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('API fuel-prices fetch warning:', err);
  }

  return DEFAULT_FUEL_PRICES;
}

/**
 * Real-time listener for fuel prices so any midnight update is instantly received by the client
 */
export function subscribeToFuelPrices(callback) {
  try {
    const docRef = doc(db, 'system_settings', 'fuel_prices');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.prices && data.prices.gasoline > 0) {
          callback({
            gasoline: data.prices.gasoline,
            diesel: data.prices.diesel,
            lpg: data.prices.lpg,
            cities: data.cities || {},
            source: data.source || 'Petrol Ofisi / Opet Resmi Fiyatları',
            lastUpdated: data.lastUpdated || (data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString())
          });
          return;
        }
      }
      callback(DEFAULT_FUEL_PRICES);
    }, (error) => {
      console.warn('Fuel prices subscription error:', error);
      callback(DEFAULT_FUEL_PRICES);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('Subscribe setup error:', e);
    callback(DEFAULT_FUEL_PRICES);
    return () => {};
  }
}

/**
 * Resolves city-specific fuel prices if available
 */
export function resolveCityPrices(allPrices, userCityName) {
  if (!allPrices || !allPrices.cities) return allPrices?.prices || DEFAULT_FUEL_PRICES;
  
  const norm = normalizeCity(userCityName);
  const cities = allPrices.cities;

  // Check matching city keys
  for (const [key, val] of Object.entries(cities)) {
    const normKey = normalizeCity(key);
    if (normKey === norm || normKey.includes(norm) || norm.includes(normKey)) {
      return {
        gasoline: val.gasoline,
        diesel: val.diesel,
        lpg: val.lpg,
        cityName: key
      };
    }
  }

  return allPrices.prices || DEFAULT_FUEL_PRICES;
}
