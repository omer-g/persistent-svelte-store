/** -------------------------- persistentStore.ts -------------------------- */

export type PersistentWritable<T> = {
  subscribe: (subscription: (value: T) => void) => () => void;
  set: (value: T) => void;
  update: (update_func: (curr: T) => T) => void;
};

/** A generic persistent store according to the Svelte store contract
 * 
 *  @example
 *      import { persistentWritable } from "./persistentStore";
 *      export const store = persistentWritable<object>("storeKey", {});
 * 
 *      $store = { id: 1 };
 *      console.log($store.id);
 * 
 *  @template T - Should be a type JSON.stringify can process
 *  @param {string} storeKey - A unique key in localStorage for the store.
 *                             This will also be the channel name in Broadcast API.
 *  @param {T} initialValue - Initial value of store
 *  @returns {PersistentWritable<T>} - A persistent writable store
 */
export const persistentWritable = <T>(storeKey: string, initialValue: T): PersistentWritable<T> => {
  let subscriptions: ((value: T) => void)[] = [];
  let storeValue: T;

  const safeParse = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(error)
      }
    }
  }

  const safeSetItem = (key: string, value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
      }
    }
  }

  const safeGetItem = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
      }
    }
  }

  let currentStoreString = safeGetItem(storeKey);
  if (currentStoreString === null || currentStoreString === undefined) {
    storeValue = initialValue;
    safeSetItem(storeKey, storeValue);
  } else {
    storeValue = safeParse(safeGetItem(storeKey));
  }

  let storeChannel = new BroadcastChannel(storeKey);
  storeChannel.onmessage = event => {
    storeValue = safeParse(safeGetItem(storeKey));
    if (event.data === storeKey) {
      subscriptions.forEach(subscriptions => subscriptions(storeValue));
    }
  }

  // Subscribes function and returns an unsubscribe function
  const subscribe = (subscription: (value: T) => void) => {
    subscription(storeValue);
    subscriptions = [...subscriptions, subscription];

    // If subscribers go from 0 to 1 (after dropping to 0 before) recreate channel
    if (subscription.length === 1 && storeChannel === null) {
      storeChannel = new BroadcastChannel(storeKey);
    }
    const unsubscribe = () => {
      subscriptions = subscriptions.filter(s => s != subscription);
      
      // If subsccribers go from 1 to 0 close channel
      if (storeChannel && subscription.length === 0) {
        storeChannel.close();
        storeChannel = null;
      }
    }
    return unsubscribe;
  }

  // Sets stringified value in local storage and calls subscriptions
  const set = (value: T) => {
    storeValue = value;
    safeSetItem(storeKey, value);
    subscriptions.forEach(subscription => subscription(storeValue));

    if (storeChannel) {
      storeChannel.postMessage(storeKey);
    }
  }

  // Updates store value according to input function
  const update =
    (update_func: (curr: T) => T) => set(update_func(storeValue));
  return { subscribe, set, update };
}
