import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePlaces } from './context/PlacesContext'
import { useMediaQuery } from './lib/hooks'
import { fromHash, navScreen, toHash, type View } from './lib/nav'
import {
  applyFilters,
  collectAreas,
  downloadJson,
  hasPin,
  sortSaved,
  sortStores,
  type CameraRequest,
  type ExploreFilters,
  type MapPoint,
  type SavedFilters,
  type Store,
} from './lib/places'
import { cn } from './lib/cn'
import { Brand, ConfirmDialog } from './components/ui'
import { MainNav } from './components/MainNav'
import { MapCanvas } from './components/MapCanvas'
import { ExplorePanel } from './components/ExplorePanel'
import { SavedPanel } from './components/SavedPanel'
import { DetailPanel } from './components/DetailPanel'
import { PlaceForm } from './components/PlaceForm'
import { PreviewCard } from './components/StoreRow'
import { IconFit, IconLocate } from './components/icons'

type DialogState =
  | { type: 'delete'; id: string }
  | { type: 'import'; stores: Store[]; skipped: number }
  | { type: 'reset' }
  | null

function historyDepth() {
  const state = window.history.state as { depth?: number } | null
  return state?.depth ?? 0
}

export function App() {
  const { stores, addStore, updateStore, deleteStore, toggleFavorite, toggleVisited, replaceAll, resetSeed } = usePlaces()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [view, setView] = useState<View>(() => fromHash(window.location.hash))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listMode, setListMode] = useState<'map' | 'list'>('map')
  const [exploreFilters, setExploreFilters] = useState<ExploreFilters>({ query: '', area: 'all', category: 'all' })
  const [savedFilters, setSavedFilters] = useState<SavedFilters>({ query: '', area: 'all', category: 'all', visit: 'all' })
  const [camera, setCamera] = useState<CameraRequest | null>(null)
  const [fitToken, setFitToken] = useState(0)
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null)
  const [locating, setLocating] = useState(false)
  const [draftPoint, setDraftPoint] = useState<MapPoint | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [toast, setToast] = useState<string | null>(null)
  const pickRef = useRef<((lat: number, lng: number) => void) | null>(null)

  const go = useCallback((next: View, mode: 'push' | 'replace' = 'push') => {
    const hash = toHash(next)
    if (window.location.hash === hash) {
      setView(next)
      return
    }
    const depth = mode === 'replace' ? historyDepth() : historyDepth() + 1
    const state = { app: true, depth }
    if (mode === 'replace') window.history.replaceState(state, '', hash)
    else window.history.pushState(state, '', hash)
    setView(next)
  }, [])

  const back = useCallback(() => {
    if (historyDepth() > 0) window.history.back()
    else go({ screen: 'explore' }, 'replace')
  }, [go])

  useEffect(() => {
    if (!(window.history.state as { app?: boolean } | null)?.app) {
      const initial = fromHash(window.location.hash)
      window.history.replaceState({ app: true, depth: 0 }, '', toHash(initial))
    }
    const onPop = () => setView(fromHash(window.location.hash))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || dialog) return
      if (view.screen === 'detail' || view.screen === 'add' || view.screen === 'edit') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [back, dialog, view])

  const visible = useMemo(() => sortStores(applyFilters(stores, exploreFilters)), [stores, exploreFilters])
  const saved = useMemo(
    () => sortSaved(applyFilters(stores, savedFilters, { favoritesOnly: true, visit: savedFilters.visit })),
    [stores, savedFilters],
  )
  const areas = useMemo(() => collectAreas(stores), [stores])
  const favoriteCount = useMemo(() => stores.filter((store) => store.isFavorite).length, [stores])
  const mapStores = useMemo(
    () => (view.screen === 'explore' ? visible : stores).filter(hasPin),
    [view.screen, visible, stores],
  )
  const mapPoints = useMemo(() => mapStores.map((store) => [store.lat, store.lng] as [number, number]), [mapStores])
  const boundsSignature =
    view.screen === 'explore' ? mapStores.map((store) => `${store.id}:${store.lat}:${store.lng}`).join('|') : ''

  useEffect(() => {
    if (view.screen !== 'explore' || !selectedId) return
    if (!visible.some((store) => store.id === selectedId)) setSelectedId(null)
  }, [view, selectedId, visible])

  useEffect(() => {
    const names: Record<View['screen'], string> = {
      explore: 'Tokyo Shopping Map',
      saved: '저장한 곳 · Tokyo Shopping Map',
      add: '매장 추가 · Tokyo Shopping Map',
      edit: '매장 수정 · Tokyo Shopping Map',
      detail: 'Tokyo Shopping Map',
    }
    if (view.screen === 'detail') {
      const store = stores.find((item) => item.id === view.id)
      document.title = store ? `${store.name} · Tokyo Shopping Map` : names.detail
      return
    }
    document.title = names[view.screen]
  }, [view, stores])

  const focusStore = useCallback(
    (id: string, zoom?: number) => {
      setSelectedId(id)
      const store = stores.find((item) => item.id === id)
      if (!store || !hasPin(store)) return
      setCamera({ lat: store.lat, lng: store.lng, zoom, minZoom: 15, token: Date.now() })
    },
    [stores],
  )

  const showOnMap = (id: string) => {
    setListMode('map')
    focusStore(id, 16)
    if (view.screen !== 'explore') go({ screen: 'explore' })
  }

  const openDetail = (id: string) => {
    focusStore(id, 16)
    go({ screen: 'detail', id })
  }

  const openEdit = (id: string) => {
    const store = stores.find((item) => item.id === id)
    setDraftPoint(store && hasPin(store) ? { lat: store.lat, lng: store.lng } : null)
    go({ screen: 'edit', id })
  }

  const openAdd = () => {
    setDraftPoint(null)
    go({ screen: 'add' })
  }

  const onNavigate = (screen: 'explore' | 'saved' | 'add') => {
    if (screen === 'add') openAdd()
    else go({ screen })
  }

  const registerPick = useCallback((handler: ((lat: number, lng: number) => void) | null) => {
    pickRef.current = handler
  }, [])

  const onPointChange = useCallback((next: MapPoint | null) => {
    setDraftPoint((prev) => {
      if (!next && !prev) return prev
      if (next && prev && next.lat === prev.lat && next.lng === prev.lng) return prev
      return next
    })
  }, [])

  const locate = () => {
    if (!navigator.geolocation) {
      setToast('이 브라우저에서는 현재 위치를 사용할 수 없습니다.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude }
        setUserLocation(next)
        setCamera({ lat: next.lat, lng: next.lng, zoom: 15, token: Date.now() })
        setLocating(false)
      },
      () => {
        setLocating(false)
        setToast('위치를 가져오지 못했습니다. 위치 권한을 확인해 주세요.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 20000 },
    )
  }

  const exportData = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJson(`tokyo-shopping-map-${stamp}.json`, {
      version: 1,
      app: 'tokyo-shopping-map',
      exportedAt: new Date().toISOString(),
      stores,
    })
    setToast('데이터를 내보냈습니다.')
  }

  const removeStore = (id: string) => {
    deleteStore(id)
    if (selectedId === id) setSelectedId(null)
    setDialog(null)
    go({ screen: 'explore' }, 'replace')
    setToast('매장을 삭제했습니다.')
  }

  const selected = stores.find((store) => store.id === selectedId) ?? null
  const editing = view.screen === 'edit' ? stores.find((store) => store.id === view.id) : undefined
  const detailStore = view.screen === 'detail' ? (stores.find((store) => store.id === view.id) ?? null) : null
  const picking = view.screen === 'add' || view.screen === 'edit'
  const showMapMobile = view.screen === 'explore' && listMode === 'map'
  const mapActive = desktop || showMapMobile
  const showNav = view.screen === 'explore' || view.screen === 'saved'

  const dialogCopy = (() => {
    if (!dialog) return null
    if (dialog.type === 'delete') {
      const store = stores.find((item) => item.id === dialog.id)
      return {
        title: '매장을 삭제할까요?',
        body: store ? `${store.name}. 지도와 목록에서 사라집니다.` : '지도와 목록에서 사라집니다.',
        confirmLabel: '삭제',
        onConfirm: () => removeStore(dialog.id),
      }
    }
    if (dialog.type === 'import') {
      return {
        title: '데이터를 가져올까요?',
        body:
          dialog.skipped > 0
            ? `${dialog.stores.length}곳을 불러옵니다. 형식이 맞지 않는 ${dialog.skipped}곳은 제외됩니다. 지금 목록은 이 파일로 바뀝니다.`
            : `${dialog.stores.length}곳을 불러옵니다. 지금 목록은 이 파일로 바뀝니다.`,
        confirmLabel: '가져오기',
        onConfirm: () => {
          replaceAll(dialog.stores)
          setSelectedId(null)
          setDialog(null)
          go({ screen: 'explore' }, 'replace')
          setToast(
            dialog.skipped > 0
              ? `${dialog.stores.length}곳을 가져왔습니다. ${dialog.skipped}곳은 제외되었습니다.`
              : `${dialog.stores.length}곳을 가져왔습니다.`,
          )
        },
      }
    }
    return {
      title: '기본 목록으로 되돌릴까요?',
      body: '직접 추가하거나 수정한 매장, 즐겨찾기, 방문 기록이 기본 목록으로 바뀝니다.',
      confirmLabel: '되돌리기',
      onConfirm: () => {
        resetSeed()
        setSelectedId(null)
        setDialog(null)
        go({ screen: 'explore' }, 'replace')
        setToast('기본 목록으로 되돌렸습니다.')
      },
    }
  })()

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink lg:flex-row">
      <aside
        className={cn(
          'flex min-h-0 min-w-0 flex-col bg-paper lg:h-dvh lg:w-[420px] lg:flex-none lg:border-r lg:border-line',
          showMapMobile ? 'shrink-0' : 'flex-1',
        )}
      >
        <div className="hidden shrink-0 items-end justify-between gap-3 border-b border-line px-5 py-4 lg:flex">
          <Brand />
          <p className="font-num text-sm tabular-nums text-mute">
            {view.screen === 'explore' &&
            (exploreFilters.query.trim() || exploreFilters.area !== 'all' || exploreFilters.category !== 'all')
              ? `${visible.length} / ${stores.length}`
              : view.screen === 'saved'
                ? saved.length
                : view.screen === 'explore'
                  ? visible.length
                  : stores.length}
            곳
          </p>
        </div>
        <div className={cn('flex min-h-0 flex-col', showMapMobile ? 'shrink-0' : 'flex-1', 'lg:flex-1')}>
          {view.screen === 'explore' ? (
            <div className={cn('scroll-thin min-h-0', listMode === 'list' && 'flex-1 overflow-y-auto', 'lg:flex-1 lg:overflow-y-auto')}>
              <ExplorePanel
                showBrand={!desktop}
                count={visible.length}
                total={stores.length}
                filters={exploreFilters}
                areas={areas}
                stores={visible}
                selectedId={selectedId}
                listMode={listMode}
                onFilters={setExploreFilters}
                onListMode={setListMode}
                onShowMap={showOnMap}
                onOpen={openDetail}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {view.screen === 'saved' ? (
                <SavedPanel
                  filters={savedFilters}
                  areas={areas}
                  stores={saved}
                  favoriteCount={favoriteCount}
                  onFilters={setSavedFilters}
                  onOpen={openDetail}
                  onShowMap={showOnMap}
                  onToggleFavorite={toggleFavorite}
                  onExport={exportData}
                  onRequestImport={(next, skipped) => setDialog({ type: 'import', stores: next, skipped })}
                  onRequestReset={() => setDialog({ type: 'reset' })}
                />
              ) : null}
              {view.screen === 'detail' ? (
                <DetailPanel
                  store={detailStore}
                  onBack={back}
                  onEdit={openEdit}
                  onDelete={(id) => setDialog({ type: 'delete', id })}
                  onToggleFavorite={toggleFavorite}
                  onToggleVisited={toggleVisited}
                />
              ) : null}
              {view.screen === 'add' || view.screen === 'edit' ? (
                view.screen === 'edit' && !editing ? (
                  <DetailPanel
                    store={null}
                    onBack={back}
                    onEdit={openEdit}
                    onDelete={(id) => setDialog({ type: 'delete', id })}
                    onToggleFavorite={toggleFavorite}
                    onToggleVisited={toggleVisited}
                  />
                ) : (
                  <PlaceForm
                    key={view.screen === 'edit' ? view.id : 'new'}
                    store={editing}
                    point={draftPoint}
                    onPointChange={onPointChange}
                    registerPick={registerPick}
                    onCancel={back}
                    onDelete={editing ? () => setDialog({ type: 'delete', id: editing.id }) : undefined}
                    onSubmit={(draft) => {
                      if (editing) {
                        updateStore(editing.id, draft)
                        setToast('매장을 저장했습니다.')
                        go({ screen: 'detail', id: editing.id }, 'replace')
                        focusStore(editing.id, 16)
                        return
                      }
                      const created = addStore(draft)
                      setToast('매장을 저장했습니다.')
                      go({ screen: 'detail', id: created.id }, 'replace')
                      focusStore(created.id, 16)
                    }}
                  />
                )
              ) : null}
            </div>
          )}
        </div>
        <MainNav active={navScreen(view)} onNavigate={onNavigate} className="hidden shrink-0 lg:grid" />
      </aside>

      <div
        className={cn(
          'relative min-h-0 bg-[#E7E4DC] lg:block lg:flex-1',
          showMapMobile ? 'flex-1' : 'hidden',
        )}
      >
        <MapCanvas
          stores={mapStores}
          selectedId={selectedId}
          onSelect={(id) => focusStore(id)}
          userLocation={userLocation}
          draftPoint={picking ? draftPoint : null}
          picking={picking}
          onPick={(lat, lng) => pickRef.current?.(lat, lng)}
          onClearSelection={() => setSelectedId(null)}
          camera={camera}
          boundsSignature={boundsSignature}
          fitToken={fitToken}
          active={mapActive}
          points={mapPoints}
        />
        {picking ? (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[500] hidden -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-card lg:block">
            지도를 눌러 위치를 지정하세요
          </div>
        ) : null}
        {view.screen === 'explore' && selected ? (
          <div className="absolute bottom-5 left-5 z-[500] hidden w-[min(360px,calc(100%-6.5rem))] lg:block">
            <PreviewCard store={selected} onOpen={() => openDetail(selected.id)} onToggleFavorite={() => toggleFavorite(selected.id)} />
          </div>
        ) : null}
        <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setFitToken((value) => value + 1)}
            aria-label="매장 전체 보기"
            className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-ink shadow-card"
          >
            <IconFit />
          </button>
          <button
            type="button"
            onClick={locate}
            aria-label="현재 위치"
            aria-busy={locating}
            className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-ink shadow-card disabled:opacity-50"
            disabled={locating}
          >
            <IconLocate />
          </button>
        </div>
      </div>

      {showMapMobile && selected ? (
        <div className="shrink-0 border-t border-line bg-paper p-3 lg:hidden">
          <PreviewCard store={selected} onOpen={() => openDetail(selected.id)} onToggleFavorite={() => toggleFavorite(selected.id)} />
        </div>
      ) : null}

      {showNav ? <MainNav active={navScreen(view)} onNavigate={onNavigate} className="shrink-0 lg:hidden" /> : null}

      {dialogCopy ? (
        <ConfirmDialog
          title={dialogCopy.title}
          body={dialogCopy.body}
          confirmLabel={dialogCopy.confirmLabel}
          onConfirm={dialogCopy.onConfirm}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 lg:bottom-8">
          <p role="status" className="rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-card">
            {toast}
          </p>
        </div>
      ) : null}
    </div>
  )
}
