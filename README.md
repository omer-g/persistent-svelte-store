# persistent-svelte-store

## Description
A generic persistent writable store, built from scratch in TypeScript according to the Svelte store contract. Store value is stored in `localStorage` as a JSON string, but this is transparent to user.

## Example
Create a store and supply a type
>`stores.ts`
>```typescript
> import { persistentWritable } from "./persistentStore";
> export const store = persistentWritable<object>("storeKey", {});
Use like any writable store
>`App.svelte`
>```typescript
> <script lang="ts">
>   import { store } from "./stores";
>   $store = { id: 1 };
>   console.log($store.id);
> </script>

## Sources
To learn more about Svelte stores see the [Svelte Docs](https://svelte.dev/docs).

## Usage
Available for use freely under the [Unlicense License](https://unlicense.org/).
