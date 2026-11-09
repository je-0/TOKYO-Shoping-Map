import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { categoryMeta, type Store } from '../lib/places'

export const buttonClass = {
  primary:
    'inline-flex h-12 items-center justify-center rounded-xl bg-accent px-4 text-base font-medium text-white transition active:scale-[0.99] disabled:opacity-40',
  ghost:
    'inline-flex h-12 items-center justify-center rounded-xl border border-line bg-surface px-4 text-base text-ink transition active:scale-[0.99]',
  quiet: 'inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm text-mute',
}

export const fieldClass =
  'h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink outline-none placeholder:text-mute/70 focus:border-ink'

export const areaClass =
  'min-h-24 w-full rounded-xl border border-line bg-surface px-3 py-3 text-base leading-relaxed text-ink outline-none placeholder:text-mute/70 focus:border-ink'

export function Brand({ large = false }: { large?: boolean }) {
  return (
    <div>
      <p className="font-num text-[10px] tracking-[0.22em] text-accent">TOKYO</p>
      <p className={cn('font-serif leading-none text-ink', large ? 'mt-1 text-[28px]' : 'text-[22px]')}>
        Shopping Guide
      </p>
      {large ? <p className="mt-1 text-[11px] text-mute">Editorial city guide</p> : null}
    </div>
  )
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="block" data-invalid={error ? 'true' : undefined}>
      <span className="mb-1.5 block text-xs font-medium text-mute">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs leading-relaxed text-accent">{error}</span> : null}
      {hint && !error ? <span className="mt-1.5 block text-xs leading-relaxed text-mute">{hint}</span> : null}
    </div>
  )
}

export function Chip({
  active,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'h-11 shrink-0 rounded-full border px-3.5 text-sm',
        active ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function CategoryDot({ category, className }: { category: Store['category']; className?: string }) {
  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', className)}
      style={{ background: categoryMeta(category).color }}
    />
  )
}

export function StoreMedia({ store, className }: { store: Store; className?: string }) {
  const [failed, setFailed] = useState(false)
  const color = categoryMeta(store.category).color

  useEffect(() => setFailed(false), [store.imageUrl])

  return (
    <div className={cn('relative overflow-hidden bg-line', className)}>
      {store.imageUrl && !failed ? (
        <img
          src={store.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(155deg, ${color} 0%, #20211F 100%)` }}
        >
          <span className="absolute bottom-3 left-3 font-serif text-3xl text-white/90">{store.name.slice(0, 1)}</span>
        </div>
      )}
    </div>
  )
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-serif text-[28px] leading-none">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mute">{body}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" className={buttonClass.ghost} onClick={onClose} autoFocus>
            취소
          </button>
          <button type="button" className={buttonClass.primary} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
