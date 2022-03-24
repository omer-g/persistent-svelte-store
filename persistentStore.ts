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
 *  @param {string} storeKey - A key in localStorage for the store
 *  @param {T} initialValue - Initial value of store
 *  @returns {PersistentWritable<T>} - A persistent writable store
 */
export const persistentWritable = <T>(storeKey: string, initialValue: T): PersistentWritable<T> => {
  let subscriptions: ((value: T) => void)[] = [];
  let storeValue: T;

  let currentStoreString = localStorage.getItem(storeKey);
  if (currentStoreString === null || currentStoreString === undefined) {
    storeValue = initialValue;
    localStorage.setItem(storeKey, JSON.stringify(storeValue));
  } else {
    storeValue = JSON.parse(localStorage.getItem(storeKey));
  }

  // Subscribes function and returns an unsubscribe function
  const subscribe = (subscription: (value: T) => void) => {
    subscription(storeValue);
    subscriptions = [...subscriptions, subscription];
    const unsubscribe = () => {
      subscriptions = subscriptions.filter(s => s != subscription);
    }
    return unsubscribe;
  }

  // Sets stringified value in local storage and calls subscriptions
  const set = (value: T) => {
    storeValue = value;
    localStorage.setItem(storeKey, JSON.stringify(value));
    subscriptions.forEach(subscription => subscription(storeValue));
  }

  // Updates store value according to input function
  const update =
    (update_func: (curr: T) => T) => set(update_func(storeValue));
  return { subscribe, set, update };
}
