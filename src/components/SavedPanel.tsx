import { useRef, useState } from 'react'
import { CATEGORY_LIST, parseStoreList, type SavedFilters, type Store } from '../lib/places'
import { cn } from '../lib/cn'
import { Chip, fieldClass } from './ui'
import { StoreRow } from './StoreRow'

export function SavedPanel({
  filters,
  areas,
  stores,
  favoriteCount,
  onFilters,
  onOpen,
  onShowMap,
  onToggleFavorite,
  onExport,
  onRequestImport,
  onRequestReset,
}: {
  filters: SavedFilters
  areas: string[]
  stores: Store[]
  favoriteCount: number
  onFilters: (filters: SavedFilters) => void
  onOpen: (id: string) => void
  onShowMap: (id: string) => void
  onToggleFavorite: (id: string) => void
  onExport: () => void
  onRequestImport: (stores: Store[], skipped: number) => void
  onRequestReset: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  async function onFile(file: File) {
    if (file.size > 2_000_000) {
      setMessage('파일이 너무 큽니다. 2MB 이하의 JSON을 사용해 주세요.')
      return
    }
    try {
      const result = parseStoreList(JSON.parse(await file.text()) as unknown)
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      if (result.stores.length === 0) {
        setMessage('가져올 매장이 없습니다.')
        return
      }
      setMessage('')
      onRequestImport(result.stores, result.skipped)
    } catch {
      setMessage('JSON 파일을 읽을 수 없습니다.')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pb-3 pt-5">
        <p className="font-num text-[10px] tracking-[0.18em] text-accent">SAVED</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="font-serif text-[28px] leading-none">저장한 곳</h2>
          <p className="font-num text-sm tabular-nums text-mute">{stores.length}곳</p>
        </div>
        <input
          value={filters.query}
          onChange={(event) => onFilters({ ...filters, query: event.target.value })}
          placeholder="저장한 매장 검색"
          aria-label="저장한 매장 검색"
          className={cn(fieldClass, 'mt-4')}
        />
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
          {CATEGORY_LIST.map((category) => (
            <Chip
              key={category.id}
              active={filters.category === category.id}
              onClick={() => onFilters({ ...filters, category: category.id })}
            >
              {category.label}
            </Chip>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(
            [
              ['all', '전체'],
              ['planned', '방문 전'],
              ['visited', '방문 완료'],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              active={filters.visit === value}
              className="w-full px-0"
              onClick={() => onFilters({ ...filters, visit: value })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {favoriteCount === 0 ? (
          <p className="px-5 py-10 text-sm leading-relaxed text-mute">
            아직 저장한 매장이 없습니다. 하트를 누르면 이곳에 모입니다.
          </p>
        ) : stores.length === 0 ? (
          <p className="px-5 py-10 text-sm leading-relaxed text-mute">조건에 맞는 매장이 없습니다.</p>
        ) : (
          <ul>
            {stores.map((store) => (
              <StoreRow
                key={store.id}
                store={store}
                onPrimary={() => onOpen(store.id)}
                onFavorite={() => onToggleFavorite(store.id)}
                onSecondary={() => onShowMap(store.id)}
                secondaryLabel={`${store.name} 지도에서 보기`}
                secondaryIcon="pin"
              />
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t border-line bg-paper px-5 py-4">
        <p className="text-xs leading-relaxed text-mute">
          추가한 매장, 즐겨찾기, 방문 기록은 이 브라우저에만 저장됩니다. 기기를 바꾸기 전에 JSON으로 내보내 두세요.
        </p>
        {message ? <p className="mt-2 text-xs leading-relaxed text-accent">{message}</p> : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="h-12 rounded-xl border border-line bg-surface text-sm" onClick={onExport}>
            내보내기
          </button>
          <button
            type="button"
            className="h-12 rounded-xl border border-line bg-surface text-sm"
            onClick={() => inputRef.current?.click()}
          >
            가져오기
          </button>
        </div>
        <button type="button" className="mt-2 h-11 w-full text-sm text-mute" onClick={onRequestReset}>
          기본 목록으로 되돌리기
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void onFile(file)
          }}
        />
      </div>
    </div>
  )
}
