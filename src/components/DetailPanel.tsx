import { categoryMeta, directionsUrl, hasPin, type Store } from '../lib/places'
import { cn } from '../lib/cn'
import { IconBack, IconHeart } from './icons'
import { buttonClass, StoreMedia } from './ui'

export function DetailPanel({
  store,
  onBack,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleVisited,
}: {
  store: Store | null
  onBack: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleVisited: (id: string) => void
}) {
  if (!store) {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
        <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface">
          <IconBack />
        </button>
        <p className="mt-8 text-sm text-mute">매장을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const meta = categoryMeta(store.category)
  const pinned = hasPin(store)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative h-60">
          <StoreMedia store={store} className="h-full w-full" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/40 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <button
              type="button"
              onClick={onBack}
              aria-label="뒤로"
              className="grid h-11 w-11 place-items-center rounded-full bg-surface/95 text-ink shadow-card"
            >
              <IconBack />
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(store.id)}
              aria-label={store.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
              aria-pressed={store.isFavorite}
              className={cn(
                'grid h-11 w-11 place-items-center rounded-full bg-surface/95 shadow-card',
                store.isFavorite ? 'text-accent' : 'text-ink',
              )}
            >
              <IconHeart filled={store.isFavorite} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-8 pt-5">
          <h2 className="font-serif text-[32px] leading-tight">{store.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs">{store.area}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
              {meta.label}
            </span>
            {store.isVisited ? <span className="rounded-full bg-ink px-3 py-1 text-xs text-paper">방문 완료</span> : null}
          </div>
          {store.description ? <p className="mt-4 text-sm leading-relaxed">{store.description}</p> : null}
          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-xs text-mute">주소</dt>
              <dd className="mt-1 text-sm leading-relaxed">{store.address}</dd>
            </div>
            <div>
              <dt className="text-xs text-mute">방문 메모</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                {store.memo || '아직 메모가 없습니다.'}
              </dd>
            </div>
          </dl>
          {store.websiteUrl ? (
            <a
              href={store.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm text-accent"
            >
              웹사이트
            </a>
          ) : null}
          <button
            type="button"
            aria-pressed={store.isVisited}
            onClick={() => onToggleVisited(store.id)}
            className="mt-6 flex h-14 w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 text-left"
          >
            <span>
              <span className="block text-sm font-medium">방문 완료</span>
              <span className="mt-0.5 block text-xs text-mute">
                {store.isVisited ? '다녀온 장소로 표시되어 있습니다.' : '아직 방문 전입니다.'}
              </span>
            </span>
            <span className={cn('flex h-7 w-12 items-center rounded-full p-0.5', store.isVisited ? 'bg-accent' : 'bg-line')}>
              <span className={cn('h-6 w-6 rounded-full bg-white transition', store.isVisited ? 'translate-x-5' : 'translate-x-0')} />
            </span>
          </button>
          {!pinned ? (
            <p className="mt-4 text-sm leading-relaxed text-accent">지도에 표시하려면 수정에서 좌표를 입력해 주세요.</p>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 border-t border-line bg-surface px-4 pt-3 pb-safe">
        {pinned ? (
          <a
            href={directionsUrl(store.lat, store.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 w-full flex-col items-center justify-center rounded-xl bg-accent px-4 text-base font-medium leading-tight text-white"
          >
            <span>길찾기</span>
            <span className="text-[10px] font-normal opacity-80">Google Maps · 도보</span>
          </a>
        ) : (
          <p className="flex h-12 items-center justify-center text-sm text-mute">좌표가 없으면 길찾기를 열 수 없습니다.</p>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className={cn(buttonClass.ghost, 'w-full')} onClick={() => onEdit(store.id)}>
            수정
          </button>
          <button type="button" className={cn(buttonClass.ghost, 'w-full text-accent')} onClick={() => onDelete(store.id)}>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
