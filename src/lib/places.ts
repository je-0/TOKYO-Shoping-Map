export const CATEGORY_LIST = [
  { id: 'Select Shop', label: '셀렉트숍', color: '#C5553D' },
  { id: 'Vintage', label: '빈티지', color: '#8C6A4A' },
  { id: 'Fashion', label: '패션', color: '#2C3A45' },
  { id: 'Lifestyle', label: '라이프스타일', color: '#3E6B58' },
  { id: 'Cafe', label: '카페', color: '#A7845A' },
] as const

export type Category = (typeof CATEGORY_LIST)[number]['id']

export type Store = {
  id: string
  name: string
  category: Category
  area: string
  address: string
  lat: number | null
  lng: number | null
  description: string
  memo: string
  imageUrl: string
  websiteUrl: string
  isFavorite: boolean
  isVisited: boolean
}

export type StoreDraft = {
  name: string
  category: Category
  area: string
  address: string
  lat: number
  lng: number
  description: string
  memo: string
  imageUrl: string
  websiteUrl: string
}

export type ExploreFilters = {
  query: string
  area: string
  category: Category | 'all'
}

export type VisitFilter = 'all' | 'planned' | 'visited'

export type SavedFilters = ExploreFilters & {
  visit: VisitFilter
}

export type CameraRequest = {
  lat: number
  lng: number
  zoom?: number
  minZoom?: number
  token: number
}

export type MapPoint = {
  lat: number
  lng: number
}

export type FieldErrors = Partial<
  Record<'name' | 'category' | 'area' | 'address' | 'lat' | 'lng' | 'description' | 'memo' | 'imageUrl' | 'websiteUrl', string>
>

export const TOKYO_BOUNDS = {
  minLat: 35.45,
  maxLat: 35.9,
  minLng: 139.3,
  maxLng: 139.95,
} as const

export const PRESET_AREAS = [
  'Shibuya',
  'Harajuku',
  'Omotesando',
  'Aoyama',
  'Ginza',
  'Shinjuku',
  'Daikanyama',
  'Nakameguro',
  'Ebisu',
  'Shimokitazawa',
  'Yoyogi',
  'Asakusa',
  'Kichijoji',
  'Koenji',
] as const

const CATEGORY_ALIASES: Record<string, Category> = {
  'select shop': 'Select Shop',
  select: 'Select Shop',
  셀렉트: 'Select Shop',
  셀렉트숍: 'Select Shop',
  셀렉트샵: 'Select Shop',
  vintage: 'Vintage',
  빈티지: 'Vintage',
  fashion: 'Fashion',
  패션: 'Fashion',
  lifestyle: 'Lifestyle',
  라이프: 'Lifestyle',
  라이프스타일: 'Lifestyle',
  cafe: 'Cafe',
  café: 'Cafe',
  카페: 'Cafe',
}

export const STORAGE_KEY = 'tokyo-shopping-map.v1'

export function categoryMeta(category: Category) {
  return CATEGORY_LIST.find((item) => item.id === category) ?? CATEGORY_LIST[0]
}

export function parseCategory(value: unknown): Category | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  return CATEGORY_ALIASES[key] ?? null
}

export function isInTokyo(lat: number, lng: number) {
  return (
    lat >= TOKYO_BOUNDS.minLat &&
    lat <= TOKYO_BOUNDS.maxLat &&
    lng >= TOKYO_BOUNDS.minLng &&
    lng <= TOKYO_BOUNDS.maxLng
  )
}

export function hasPin(store: Store): store is Store & { lat: number; lng: number } {
  return (
    typeof store.lat === 'number' &&
    typeof store.lng === 'number' &&
    Number.isFinite(store.lat) &&
    Number.isFinite(store.lng) &&
    Math.abs(store.lat) <= 90 &&
    Math.abs(store.lng) <= 180 &&
    !(store.lat === 0 && store.lng === 0)
  )
}

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`
}

export function cloneStores(stores: Store[]) {
  return stores.map((store) => ({ ...store }))
}

export function sortAreas(areas: string[]) {
  const preset = PRESET_AREAS as readonly string[]
  return [...areas].sort((a, b) => {
    const ia = preset.indexOf(a)
    const ib = preset.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'ko')
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

export function collectAreas(stores: Store[]) {
  return sortAreas([...new Set(stores.map((store) => store.area).filter(Boolean))])
}

export function sortStores(stores: Store[]) {
  return [...stores].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

export function sortSaved(stores: Store[]) {
  return [...stores].sort(
    (a, b) => Number(a.isVisited) - Number(b.isVisited) || a.name.localeCompare(b.name, 'ko'),
  )
}

export function applyFilters(
  stores: Store[],
  filters: ExploreFilters,
  options?: { favoritesOnly?: boolean; visit?: VisitFilter },
) {
  const query = filters.query.trim().toLowerCase()
  return stores.filter((store) => {
    if (options?.favoritesOnly && !store.isFavorite) return false
    if (options?.visit === 'planned' && store.isVisited) return false
    if (options?.visit === 'visited' && !store.isVisited) return false
    if (filters.area !== 'all' && store.area !== filters.area) return false
    if (filters.category !== 'all' && store.category !== filters.category) return false
    if (!query) return true
    return `${store.name} ${store.description}`.toLowerCase().includes(query)
  })
}

function clip(value: unknown, max: number) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function readCoord(value: unknown): number | null {
  if (value == null || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return null
  return number
}

function safeId(value: unknown, index: number) {
  const raw = clip(value, 80).replace(/[/\s#?&]/g, '-')
  return raw || `place-${index + 1}-${createId().slice(0, 8)}`
}

export function parseStore(value: unknown, index: number): Store | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const name = clip(raw.name, 80)
  const category = parseCategory(raw.category)
  const area = clip(raw.area, 40)
  const address = clip(raw.address, 200)
  if (!name || !category || !area || !address) return null

  const lat = readCoord(raw.lat)
  const lng = readCoord(raw.lng)
  if ((lat == null) !== (lng == null)) return null
  if (lat != null && lng != null && (Math.abs(lat) > 90 || Math.abs(lng) > 180)) return null

  const imageUrl = clip(raw.imageUrl, 500)
  const websiteUrl = clip(raw.websiteUrl, 500)

  return {
    id: safeId(raw.id, index),
    name,
    category,
    area,
    address,
    lat,
    lng,
    description: clip(raw.description, 500),
    memo: clip(raw.memo, 1000),
    imageUrl,
    websiteUrl,
    isFavorite: raw.isFavorite === true,
    isVisited: raw.isVisited === true,
  }
}

function extractList(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return null
  const stores = (data as { stores?: unknown }).stores
  return Array.isArray(stores) ? stores : null
}

export function parseStoreList(
  data: unknown,
): { ok: true; stores: Store[]; skipped: number } | { ok: false; error: string } {
  const list = extractList(data)
  if (!list) return { ok: false, error: '파일 형식이 올바르지 않습니다. 이 앱에서 내보낸 JSON을 사용해 주세요.' }
  if (list.length > 500) return { ok: false, error: '한 번에 가져올 수 있는 매장은 500곳까지입니다.' }

  const stores: Store[] = []
  const ids = new Set<string>()
  let skipped = 0

  list.forEach((item, index) => {
    const store = parseStore(item, index)
    if (!store) {
      skipped += 1
      return
    }
    let id = store.id
    let suffix = 2
    while (ids.has(id)) {
      id = `${store.id}-${suffix}`
      suffix += 1
    }
    ids.add(id)
    stores.push({ ...store, id })
  })

  if (stores.length === 0 && list.length > 0) {
    return { ok: false, error: '가져올 수 있는 매장이 없습니다. 이름, 카테고리, 지역, 주소를 확인해 주세요.' }
  }

  return { ok: true, stores, skipped }
}

function optionalUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return trimmed
  } catch {
    return null
  }
}

export function validateDraft(input: {
  name: string
  category: string
  area: string
  address: string
  latText: string
  lngText: string
  description: string
  memo: string
  imageUrl: string
  websiteUrl: string
}): { ok: true; draft: StoreDraft } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {}
  const name = input.name.trim()
  if (!name) errors.name = '매장명을 입력해 주세요.'
  else if (name.length > 80) errors.name = '매장명은 80자 이하로 입력해 주세요.'

  const category = parseCategory(input.category)
  if (!category) errors.category = '카테고리를 선택해 주세요.'

  const area = input.area.trim()
  if (!area) errors.area = '지역을 입력해 주세요.'
  else if (area.length > 40) errors.area = '지역은 40자 이하로 입력해 주세요.'

  const address = input.address.trim()
  if (!address) errors.address = '주소를 입력해 주세요.'
  else if (address.length > 200) errors.address = '주소는 200자 이하로 입력해 주세요.'

  const lat = Number(input.latText)
  const lng = Number(input.lngText)
  if (!input.latText.trim() || !Number.isFinite(lat)) errors.lat = '위도를 입력해 주세요.'
  else if (lat < -90 || lat > 90) errors.lat = '위도는 -90에서 90 사이여야 합니다.'

  if (!input.lngText.trim() || !Number.isFinite(lng)) errors.lng = '경도를 입력해 주세요.'
  else if (lng < -180 || lng > 180) errors.lng = '경도는 -180에서 180 사이여야 합니다.'

  if (!errors.lat && !errors.lng && !isInTokyo(lat, lng)) {
    errors.lat = `도쿄 범위(위도 ${TOKYO_BOUNDS.minLat}–${TOKYO_BOUNDS.maxLat}, 경도 ${TOKYO_BOUNDS.minLng}–${TOKYO_BOUNDS.maxLng})만 저장할 수 있습니다.`
    errors.lng = '도쿄 범위의 좌표만 저장할 수 있습니다.'
  }

  const description = input.description.trim()
  if (description.length > 500) errors.description = '소개는 500자 이하로 입력해 주세요.'
  const memo = input.memo.trim()
  if (memo.length > 1000) errors.memo = '메모는 1000자 이하로 입력해 주세요.'

  const imageUrl = optionalUrl(input.imageUrl)
  const websiteUrl = optionalUrl(input.websiteUrl)
  if (imageUrl == null) errors.imageUrl = 'http 또는 https로 시작하는 이미지 주소를 입력해 주세요.'
  if (websiteUrl == null) errors.websiteUrl = 'http 또는 https로 시작하는 웹사이트 주소를 입력해 주세요.'

  if (Object.keys(errors).length > 0 || !category || imageUrl == null || websiteUrl == null) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    draft: { name, category, area, address, lat, lng, description, memo, imageUrl, websiteUrl },
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
