import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  CATEGORY_LIST,
  PRESET_AREAS,
  TOKYO_BOUNDS,
  isInTokyo,
  validateDraft,
  type MapPoint,
  type Store,
  type StoreDraft,
} from '../lib/places'
import { useMediaQuery } from '../lib/hooks'
import { cn } from '../lib/cn'
import { IconBack } from './icons'
import { Chip, Field, areaClass, buttonClass, fieldClass } from './ui'
import { MiniMap } from './MapCanvas'

const presetAreas = PRESET_AREAS as readonly string[]

export function PlaceForm({
  store,
  point,
  onPointChange,
  registerPick,
  onCancel,
  onSubmit,
  onDelete,
}: {
  store?: Store
  point: MapPoint | null
  onPointChange: (point: MapPoint | null) => void
  registerPick: (handler: ((lat: number, lng: number) => void) | null) => void
  onCancel: () => void
  onSubmit: (draft: StoreDraft) => void
  onDelete?: () => void
}) {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const formRef = useRef<HTMLFormElement>(null)
  const [name, setName] = useState(store?.name ?? '')
  const [category, setCategory] = useState(store?.category ?? '')
  const [areaChoice, setAreaChoice] = useState(() => {
    if (!store?.area) return ''
    return presetAreas.includes(store.area) ? store.area : '__custom__'
  })
  const [customArea, setCustomArea] = useState(store && !presetAreas.includes(store.area) ? store.area : '')
  const [address, setAddress] = useState(store?.address ?? '')
  const [latText, setLatText] = useState(store?.lat != null ? String(store.lat) : '')
  const [lngText, setLngText] = useState(store?.lng != null ? String(store.lng) : '')
  const [description, setDescription] = useState(store?.description ?? '')
  const [memo, setMemo] = useState(store?.memo ?? '')
  const [imageUrl, setImageUrl] = useState(store?.imageUrl ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(store?.websiteUrl ?? '')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const area = areaChoice === '__custom__' ? customArea : areaChoice

  useEffect(() => {
    registerPick((lat, lng) => {
      setLatText(lat.toFixed(6))
      setLngText(lng.toFixed(6))
    })
    return () => registerPick(null)
  }, [registerPick])

  useEffect(() => {
    const lat = Number(latText)
    const lng = Number(lngText)
    const complete = Boolean(latText.trim() && lngText.trim() && Number.isFinite(lat) && Number.isFinite(lng))
    if (!complete) {
      onPointChange(null)
      setErrors((prev) => {
        if (!prev.lat && !prev.lng) return prev
        return { ...prev, lat: undefined, lng: undefined }
      })
      return
    }
    onPointChange({ lat, lng })
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || !isInTokyo(lat, lng)) {
      setErrors((prev) => ({
        ...prev,
        lat: `도쿄 범위(위도 ${TOKYO_BOUNDS.minLat}–${TOKYO_BOUNDS.maxLat}, 경도 ${TOKYO_BOUNDS.minLng}–${TOKYO_BOUNDS.maxLng})만 저장할 수 있습니다.`,
        lng: '도쿄 범위의 좌표만 저장할 수 있습니다.',
      }))
      return
    }
    setErrors((prev) => {
      if (!prev.lat && !prev.lng) return prev
      return { ...prev, lat: undefined, lng: undefined }
    })
  }, [latText, lngText, onPointChange])

  function updateLat(value: string) {
    const parts = value.split(/[,\s]+/).filter(Boolean)
    if (parts.length >= 2 && parts.slice(0, 2).every((part) => /^-?\d+(\.\d+)?$/.test(part))) {
      setLatText(parts[0])
      setLngText(parts[1])
      return
    }
    setLatText(value)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const result = validateDraft({
      name,
      category,
      area,
      address,
      latText,
      lngText,
      description,
      memo,
      imageUrl,
      websiteUrl,
    })
    if (!result.ok) {
      setErrors(result.errors)
      requestAnimationFrame(() => {
        formRef.current?.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      return
    }
    onSubmit(result.draft)
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
        <button
          type="button"
          onClick={onCancel}
          aria-label="뒤로"
          className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface"
        >
          <IconBack />
        </button>
        <h2 className="mt-4 font-serif text-[32px] leading-none">{store ? '매장 수정' : '매장 추가'}</h2>
        <div className="mt-6 space-y-4">
          <Field label="매장명" error={errors.name}>
            <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} maxLength={80} aria-label="매장명" />
          </Field>
          <Field label="카테고리" error={errors.category}>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_LIST.map((item) => (
                <Chip key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>
                  {item.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="지역" error={errors.area}>
            <select
              value={areaChoice}
              onChange={(event) => setAreaChoice(event.target.value)}
              className={fieldClass}
              aria-label="지역"
            >
              <option value="">지역 선택</option>
              {PRESET_AREAS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="__custom__">직접 입력</option>
            </select>
            {areaChoice === '__custom__' ? (
              <input
                value={customArea}
                onChange={(event) => setCustomArea(event.target.value)}
                className={cn(fieldClass, 'mt-2')}
                placeholder="지역 이름"
                maxLength={40}
              />
            ) : null}
          </Field>
          <Field label="주소" error={errors.address}>
            <input value={address} onChange={(event) => setAddress(event.target.value)} className={fieldClass} maxLength={200} aria-label="주소" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="위도" error={errors.lat}>
              <input
                value={latText}
                onChange={(event) => updateLat(event.target.value)}
                inputMode="decimal"
                className={fieldClass}
                placeholder="35.665000"
                aria-label="위도"
              />
            </Field>
            <Field label="경도" error={errors.lng}>
              <input
                value={lngText}
                onChange={(event) => setLngText(event.target.value)}
                inputMode="decimal"
                className={fieldClass}
                placeholder="139.710000"
                aria-label="경도"
              />
            </Field>
          </div>
          <p className="text-xs leading-relaxed text-mute">
            {desktop
              ? '아래 지도나 오른쪽 큰 지도를 누르면 좌표가 들어갑니다. 위도, 경도를 한 칸에 붙여 넣어도 됩니다.'
              : '지도를 누르면 좌표가 들어갑니다. 위도와 경도를 쉼표로 붙여 넣어도 됩니다.'}
          </p>
          <div className="h-56 overflow-hidden rounded-2xl border border-line">
            <MiniMap
              point={point}
              onPick={(lat, lng) => {
                setLatText(lat.toFixed(6))
                setLngText(lng.toFixed(6))
              }}
            />
          </div>
          <Field label="소개" error={errors.description}>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={areaClass} maxLength={500} aria-label="소개" />
          </Field>
          <Field label="개인 메모" error={errors.memo}>
            <textarea value={memo} onChange={(event) => setMemo(event.target.value)} className={areaClass} maxLength={1000} aria-label="개인 메모" />
          </Field>
          <Field label="이미지 URL" error={errors.imageUrl} hint="비워 두면 색면으로 표시됩니다.">
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className={fieldClass}
              placeholder="https://"
              inputMode="url"
              aria-label="이미지 URL"
            />
          </Field>
          <Field label="웹사이트" error={errors.websiteUrl}>
            <input
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              className={fieldClass}
              placeholder="https://"
              inputMode="url"
              aria-label="웹사이트"
            />
          </Field>
          {onDelete ? (
            <button type="button" onClick={onDelete} className="h-11 text-sm text-accent">
              이 매장 삭제
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line bg-surface px-4 pt-3 pb-safe">
        <button type="button" className={cn(buttonClass.ghost, 'w-full')} onClick={onCancel}>
          취소
        </button>
        <button type="submit" className={cn(buttonClass.primary, 'w-full')}>
          저장
        </button>
      </div>
    </form>
  )
}
