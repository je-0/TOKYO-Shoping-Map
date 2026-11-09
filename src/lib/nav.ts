export type View =
  | { screen: 'explore' }
  | { screen: 'saved' }
  | { screen: 'detail'; id: string }
  | { screen: 'add' }
  | { screen: 'edit'; id: string }

export function toHash(view: View) {
  switch (view.screen) {
    case 'explore':
      return '#/explore'
    case 'saved':
      return '#/saved'
    case 'add':
      return '#/add'
    case 'detail':
      return `#/place/${encodeURIComponent(view.id)}`
    case 'edit':
      return `#/edit/${encodeURIComponent(view.id)}`
  }
}

export function fromHash(hash: string): View {
  const parts = hash.replace(/^#/, '').split('/').filter(Boolean)
  if (parts[0] === 'saved') return { screen: 'saved' }
  if (parts[0] === 'add') return { screen: 'add' }
  if (parts[0] === 'place' && parts[1]) return { screen: 'detail', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'edit' && parts[1]) return { screen: 'edit', id: decodeURIComponent(parts[1]) }
  return { screen: 'explore' }
}

export function navScreen(view: View): 'explore' | 'saved' | 'add' {
  if (view.screen === 'saved') return 'saved'
  if (view.screen === 'add' || view.screen === 'edit') return 'add'
  return 'explore'
}
