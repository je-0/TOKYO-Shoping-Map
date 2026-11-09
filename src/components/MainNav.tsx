import { cn } from '../lib/cn'
import { IconHeart, IconMap, IconPlus } from './icons'

export function MainNav({
  active,
  onNavigate,
  className,
}: {
  active: 'explore' | 'saved' | 'add'
  onNavigate: (screen: 'explore' | 'saved' | 'add') => void
  className?: string
}) {
  return (
    <nav className={cn('grid grid-cols-3 border-t border-line bg-surface pb-safe', className)} aria-label="주요 메뉴">
      <button
        type="button"
        aria-current={active === 'explore' ? 'page' : undefined}
        onClick={() => onNavigate('explore')}
        className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px]', active === 'explore' ? 'text-accent' : 'text-mute')}
      >
        <IconMap />
        지도
      </button>
      <button
        type="button"
        aria-current={active === 'saved' ? 'page' : undefined}
        onClick={() => onNavigate('saved')}
        className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px]', active === 'saved' ? 'text-accent' : 'text-mute')}
      >
        <IconHeart filled={active === 'saved'} />
        저장
      </button>
      <button
        type="button"
        aria-current={active === 'add' ? 'page' : undefined}
        onClick={() => onNavigate('add')}
        className={cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px]', active === 'add' ? 'text-accent' : 'text-mute')}
      >
        <IconPlus />
        추가
      </button>
    </nav>
  )
}
