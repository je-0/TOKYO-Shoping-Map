import { useEffect, useRef } from 'react'
import { LngLatBounds, Map, Marker, NavigationControl, setWorkerUrl, type ExpressionSpecification } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { categoryMeta, hasPin, type CameraRequest, type MapPoint, type Store } from '../lib/places'

setWorkerUrl(maplibreWorkerUrl)

const TOKYO_CENTER: [number, number] = [139.712, 35.6654]
const STYLE = 'https://tiles.openfreemap.org/styles/positron'
const LOCALE = {
  'NavigationControl.ZoomIn': '확대',
  'NavigationControl.ZoomOut': '축소',
  'AttributionControl.ToggleAttribution': '지도 출처',
  'AttributionControl.MapFeedback': '지도 피드백',
}

const KOREAN_LABEL = [
  'coalesce',
  ['get', 'name:ko'],
  ['get', 'name:en'],
  ['get', 'name_en'],
  ['get', 'name:latin'],
  ['get', 'name'],
] as ExpressionSpecification

function applyKoreanLabels(map: Map) {
  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type !== 'symbol') continue
    const field = map.getLayoutProperty(layer.id, 'text-field')
    if (!field || !JSON.stringify(field).includes('name')) continue
    map.setLayoutProperty(layer.id, 'text-field', KOREAN_LABEL)
    map.setLayoutProperty(layer.id, 'text-font', ['Noto Sans Regular'])
  }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function pinButton(store: Store, active: boolean) {
  const size = active ? 30 : 24
  const color = categoryMeta(store.category).color
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'store-pin'
  button.style.width = `${size}px`
  button.style.height = `${size}px`
  button.setAttribute('aria-label', store.name)
  const heart = store.isFavorite
    ? '<svg class="pin-heart" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10.2S2.8 8 2.8 5.7A1.85 1.85 0 0 1 6 4.5a1.85 1.85 0 0 1 3.2 1.2C9.2 8 6 10.2 6 10.2Z" fill="#C5553D"/></svg>'
    : ''
  button.innerHTML = `<span class="pin${active ? ' is-active' : ''}${store.isVisited ? ' is-visited' : ''}" style="--pin:${color}"><span class="pin-dot"></span>${heart}</span>`
  return button
}

function dot(className: string, color: string, size: number) {
  const element = document.createElement('div')
  element.className = className
  element.style.width = `${size}px`
  element.style.height = `${size}px`
  element.style.borderRadius = '999px'
  element.style.background = color
  element.style.border = '2px solid #fff'
  element.style.boxShadow = '0 1px 5px rgba(32, 33, 31, 0.35)'
  element.style.pointerEvents = 'none'
  return element
}

function createMap(container: HTMLElement, center: [number, number], zoom: number, interactive: boolean) {
  const map = new Map({
    container,
    style: STYLE,
    center,
    zoom,
    minZoom: 3,
    maxZoom: 18,
    maxPitch: 0,
    attributionControl: { compact: false },
    locale: LOCALE,
    scrollZoom: interactive,
    dragPan: interactive,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    doubleClickZoom: interactive,
    keyboard: interactive,
  })
  map.addControl(new NavigationControl({ showCompass: false, showZoom: true }), 'top-left')
  map.on('load', () => applyKoreanLabels(map))
  return map
}

export function MapCanvas({
  stores,
  selectedId,
  onSelect,
  userLocation,
  draftPoint,
  picking,
  onPick,
  onClearSelection,
  camera,
  boundsSignature,
  fitToken,
  active,
  points,
}: {
  stores: Store[]
  selectedId: string | null
  onSelect: (id: string) => void
  userLocation: MapPoint | null
  draftPoint: MapPoint | null
  picking: boolean
  onPick: (lat: number, lng: number) => void
  onClearSelection: () => void
  camera: CameraRequest | null
  boundsSignature: string
  fitToken: number
  active: boolean
  points: [number, number][]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const actionsRef = useRef({ onSelect, onPick, onClearSelection, picking })
  actionsRef.current = { onSelect, onPick, onClearSelection, picking }
  const pointsRef = useRef(points)
  pointsRef.current = points
  const prevSignature = useRef('')
  const prevFit = useRef(0)
  const prevCamera = useRef<number | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = createMap(container, TOKYO_CENTER, 12, true)
    map.on('click', (event) => {
      const target = event.originalEvent.target
      if (target instanceof Element && target.closest('.store-pin')) return
      const actions = actionsRef.current
      if (actions.picking) actions.onPick(event.lngLat.lat, event.lngLat.lng)
      else actions.onClearSelection()
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const markers: Marker[] = []
    for (const store of stores.filter(hasPin)) {
      const selected = store.id === selectedId
      const button = pinButton(store, selected)
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        const actions = actionsRef.current
        if (actions.picking) actions.onPick(store.lat, store.lng)
        else actions.onSelect(store.id)
      })
      const marker = new Marker({ element: button, anchor: 'center' }).setLngLat([store.lng, store.lat]).addTo(map)
      marker.getElement().style.zIndex = selected ? '8' : '1'
      markers.push(marker)
    }
    if (userLocation) {
      markers.push(
        new Marker({ element: dot('map-user', '#3A7CA5', 16), anchor: 'center' })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map),
      )
    }
    if (draftPoint) {
      markers.push(
        new Marker({ element: dot('map-draft', '#C5553D', 18), anchor: 'center' })
          .setLngLat([draftPoint.lng, draftPoint.lat])
          .addTo(map),
      )
    }
    return () => {
      for (const marker of markers) marker.remove()
    }
  }, [stores, selectedId, userLocation, draftPoint])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !active) return
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(map.getContainer())
    map.resize()
    return () => observer.disconnect()
  }, [active])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !active) return
    const signatureChanged = boundsSignature.length > 0 && boundsSignature !== prevSignature.current
    const fitRequested = fitToken !== prevFit.current
    if (!signatureChanged && !fitRequested) return
    if (boundsSignature.length > 0) prevSignature.current = boundsSignature
    prevFit.current = fitToken
    const current = pointsRef.current
    if (current.length === 0) return
    map.resize()
    const duration = reducedMotion() ? 0 : 600
    if (current.length === 1) {
      const [lat, lng] = current[0]
      map.flyTo({ center: [lng, lat], zoom: 15, duration })
      return
    }
    const bounds = new LngLatBounds()
    for (const [lat, lng] of current) bounds.extend([lng, lat])
    map.fitBounds(bounds, { padding: 36, maxZoom: 14, duration })
  }, [active, boundsSignature, fitToken])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !camera || camera.token === prevCamera.current) return
    prevCamera.current = camera.token
    const zoom = camera.zoom ?? Math.max(map.getZoom(), camera.minZoom ?? 15)
    map.flyTo({
      center: [camera.lng, camera.lat],
      zoom,
      duration: reducedMotion() ? 0 : 600,
    })
  }, [camera])

  return (
    <div className={picking ? 'map-picking absolute inset-0' : 'absolute inset-0'}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}

export function MiniMap({ point, onPick }: { point: MapPoint | null; onPick: (lat: number, lng: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = createMap(
      container,
      point ? [point.lng, point.lat] : TOKYO_CENTER,
      point ? 16 : 12,
      true,
    )
    map.scrollZoom.disable()
    map.on('click', (event) => onPickRef.current(event.lngLat.lat, event.lngLat.lng))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // The first frame uses the coordinates already on screen. Later edits move the camera below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !point) return
    const marker = new Marker({ element: dot('map-draft', '#C5553D', 18), anchor: 'center' })
      .setLngLat([point.lng, point.lat])
      .addTo(map)
    if (!map.getBounds().contains([point.lng, point.lat])) {
      map.easeTo({
        center: [point.lng, point.lat],
        zoom: Math.max(map.getZoom(), 15),
        duration: reducedMotion() ? 0 : 400,
      })
    }
    return () => {
      marker.remove()
    }
  }, [point])

  return <div ref={containerRef} className="map-mini h-full w-full" />
}
