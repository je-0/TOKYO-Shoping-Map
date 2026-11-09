import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { seedStores } from '../data/seed'
import {
  STORAGE_KEY,
  cloneStores,
  createId,
  parseStoreList,
  type Store,
  type StoreDraft,
} from '../lib/places'

type PlacesContextValue = {
  stores: Store[]
  addStore: (draft: StoreDraft) => Store
  updateStore: (id: string, draft: StoreDraft) => void
  deleteStore: (id: string) => void
  toggleFavorite: (id: string) => void
  toggleVisited: (id: string) => void
  replaceAll: (stores: Store[]) => void
  resetSeed: () => void
}

const PlacesContext = createContext<PlacesContextValue | null>(null)
const SEED_REVISION = 3

function loadStores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneStores(seedStores)
    const parsed: unknown = JSON.parse(raw)
    const result = parseStoreList(parsed)
    if (!result.ok) return cloneStores(seedStores)
    const revision =
      parsed && typeof parsed === 'object' && 'seedRevision' in parsed && typeof parsed.seedRevision === 'number'
        ? parsed.seedRevision
        : 1
    if (revision >= SEED_REVISION) return result.stores
    const known = new Set(result.stores.map((store) => store.id))
    const merged = [...result.stores, ...cloneStores(seedStores).filter((store) => !known.has(store.id))]
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, seedRevision: SEED_REVISION, stores: merged }))
    return merged
  } catch {
    return cloneStores(seedStores)
  }
}

function saveStores(stores: Store[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, seedRevision: SEED_REVISION, stores }))
}

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>(loadStores)
  const dirty = useRef(false)

  useEffect(() => {
    if (!dirty.current) return
    saveStores(stores)
  }, [stores])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const result = parseStoreList(JSON.parse(event.newValue) as unknown)
        if (!result.ok) return
        dirty.current = false
        setStores(result.stores)
      } catch {
        // 다른 탭의 값이 깨져 있으면 이 탭의 목록을 유지한다.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((recipe: (prev: Store[]) => Store[]) => {
    dirty.current = true
    setStores(recipe)
  }, [])

  const value = useMemo<PlacesContextValue>(
    () => ({
      stores,
      addStore: (draft) => {
        const store: Store = { ...draft, id: createId(), isFavorite: false, isVisited: false }
        update((prev) => [...prev, store])
        return store
      },
      updateStore: (id, draft) => {
        update((prev) => prev.map((store) => (store.id === id ? { ...store, ...draft, id } : store)))
      },
      deleteStore: (id) => {
        update((prev) => prev.filter((store) => store.id !== id))
      },
      toggleFavorite: (id) => {
        update((prev) => prev.map((store) => (store.id === id ? { ...store, isFavorite: !store.isFavorite } : store)))
      },
      toggleVisited: (id) => {
        update((prev) => prev.map((store) => (store.id === id ? { ...store, isVisited: !store.isVisited } : store)))
      },
      replaceAll: (next) => {
        update(() => cloneStores(next))
      },
      resetSeed: () => {
        update(() => cloneStores(seedStores))
      },
    }),
    [stores, update],
  )

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>
}

export function usePlaces() {
  const context = useContext(PlacesContext)
  if (!context) throw new Error('PlacesProvider가 필요합니다.')
  return context
}
