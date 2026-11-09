import { CATEGORY_LIST, type ExploreFilters, type Store } from '../lib/places'
import { cn } from '../lib/cn'
import { fieldClass, Brand, Chip } from './ui'
import { StoreRow } from './StoreRow'

export function ExplorePanel({
  showBrand,
  count,
  total,
  filters,
  areas,
  stores,
  selectedId,
  listMode,
  onFilters,
  onListMode,
  onShowMap,
  onOpen,
  onToggleFavorite,
}: {
  showBrand: boolean
  count: number
  total: number
  filters: ExploreFilters
  areas: string[]
  stores: Store[]
  selectedId: string | null
  listMode: 'map' | 'list'
  onFilters: (filters: ExploreFilters) => void
  onListMode: (mode: 'map' | 'list') => void
  onShowMap: (id: string) => void
  onOpen: (id: string) => void
  onToggleFavorite: (id: string) => void
}) {
  const filtering = filters.query.trim() !== '' || filters.area !== 'all' || filters.category !== 'all'

  return (
    <div>
      <div className="sticky top-0 z-10 bg-paper/95 px-4 pb-3 pt-4 backdrop-blur lg:px-5">
        {showBrand ? (
          <div className="flex items-end justify-between gap-3">
            <Brand large />
            <p className="pb-1 font-num text-sm tabular-nums text-mute" aria-live="polite">
              {filtering ? `${count} / ${total}` : count}
              <span className="ml-0.5">곳</span>
            </p>
          </div>
        ) : null}
        <div className="relative mt-4">
          <input
            value={filters.query}
            onChange={(event) => onFilters({ ...filters, query: event.target.value })}
            placeholder="매장 이름 검색"
            aria-label="매장 이름 검색"
            className={cn(fieldClass, 'pr-12')}
            autoComplete="off"
          />
          {filters.query ? (
            <button
              type="button"
              className="absolute right-1 top-1 grid h-10 w-10 place-items-center text-lg text-mute"
              aria-label="검색어 지우기"
              onClick={() => onFilters({ ...filters, query: '' })}
            >
              ×
            </button>
          ) : null}
        </div>
        <select
          aria-label="지역"
          value={filters.area}
          onChange={(event) => onFilters({ ...filters, area: event.target.value })}
          className={cn(fieldClass, 'mt-2')}
        >
          <option value="all">모든 지역</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip active={filters.category === 'all'} onClick={() => onFilters({ ...filters, category: 'all' })}>
            전체
          </Chip>
          {CATEGORY_LIST.map((category) => {
            const active = filters.category === category.id
            return (
              <Chip
                key={category.id}
                active={active}
                onClick={() => onFilters({ ...filters, category: category.id })}
              >
                {active ? null : (
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: category.color }} />
                )}
                {category.label}
              </Chip>
            )
          })}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1 lg:hidden">
          <button
            type="button"
            className={cn('h-11 rounded-full text-sm', listMode === 'map' ? 'bg-ink text-paper' : 'text-mute')}
            onClick={() => onListMode('map')}
          >
            지도
          </button>
          <button
            type="button"
            className={cn('h-11 rounded-full text-sm', listMode === 'list' ? 'bg-ink text-paper' : 'text-mute')}
            onClick={() => onListMode('list')}
          >
            목록
          </button>
        </div>
      </div>
      {stores.length === 0 ? (
        <p className={cn('px-5 py-10 text-sm leading-relaxed text-mute', listMode === 'map' && 'max-lg:hidden')}>
          {total === 0
            ? '등록된 매장이 없습니다. 추가에서 첫 장소를 넣어 보세요.'
            : '조건에 맞는 매장이 없습니다. 필터를 바꿔 보세요.'}
        </p>
      ) : (
        <ul className={cn(listMode === 'map' && 'max-lg:hidden')}>
          {stores.map((store) => (
            <StoreRow
              key={store.id}
              store={store}
              active={store.id === selectedId}
              onPrimary={() => onShowMap(store.id)}
              onFavorite={() => onToggleFavorite(store.id)}
              onSecondary={() => onOpen(store.id)}
              secondaryLabel={`${store.name} 상세보기`}
              secondaryIcon="chevron"
            />
          ))}
        </ul>
      )}
    </div>
  )
}
