import { categoryMeta, hasPin, type Store } from '../lib/places'
import { cn } from '../lib/cn'
import { IconChevron, IconHeart, IconPin } from './icons'
import { CategoryDot, StoreMedia } from './ui'

export function StoreRow({
  store,
  active,
  onPrimary,
  onFavorite,
  onSecondary,
  secondaryLabel,
  secondaryIcon,
}: {
  store: Store
  active?: boolean
  onPrimary: () => void
  onFavorite: () => void
  onSecondary: () => void
  secondaryLabel: string
  secondaryIcon: 'chevron' | 'pin'
}) {
  const meta = categoryMeta(store.category)
  return (
    <li className={cn('border-b border-line', active && 'bg-surface')}>
      <div className="flex items-stretch">
        <button type="button" onClick={onPrimary} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left">
          <CategoryDot category={store.category} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-medium">{store.name}</span>
            <span className="mt-0.5 block truncate text-xs text-mute">
              {store.area} · {meta.label}
              {store.isVisited ? ' · 방문 완료' : ''}
              {hasPin(store) ? '' : ' · 좌표 필요'}
            </span>
          </span>
        </button>
        <button
          type="button"
          className={cn('grid w-12 shrink-0 place-items-center', store.isFavorite ? 'text-accent' : 'text-ink')}
          aria-label={store.isFavorite ? `${store.name} 즐겨찾기 해제` : `${store.name} 즐겨찾기`}
          aria-pressed={store.isFavorite}
          onClick={onFavorite}
        >
          <IconHeart filled={store.isFavorite} />
        </button>
        <button
          type="button"
          className="grid w-12 shrink-0 place-items-center text-mute"
          aria-label={secondaryLabel}
          onClick={onSecondary}
        >
          {secondaryIcon === 'pin' ? <IconPin /> : <IconChevron />}
        </button>
      </div>
    </li>
  )
}

export function PreviewCard({
  store,
  onOpen,
  onToggleFavorite,
}: {
  store: Store
  onOpen: () => void
  onToggleFavorite: () => void
}) {
  const meta = categoryMeta(store.category)
  return (
    <article className="flex gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
      <StoreMedia store={store} className="h-[76px] w-[76px] shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 truncate font-serif text-[22px] leading-none">{store.name}</h2>
          <button
            type="button"
            className={cn('grid h-11 w-11 shrink-0 place-items-center', store.isFavorite ? 'text-accent' : 'text-ink')}
            aria-label={store.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
            aria-pressed={store.isFavorite}
            onClick={onToggleFavorite}
          >
            <IconHeart filled={store.isFavorite} />
          </button>
        </div>
        <p className="mt-1 text-xs text-mute">
          {store.area} · {meta.label}
          {store.isVisited ? ' · 방문 완료' : ''}
        </p>
        {store.description ? <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink/80">{store.description}</p> : null}
        <button type="button" onClick={onOpen} className="mt-1.5 text-sm font-medium text-accent">
          상세보기
        </button>
      </div>
    </article>
  )
}
