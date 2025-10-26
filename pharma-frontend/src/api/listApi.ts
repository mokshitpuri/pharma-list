/**
 * Mock list API for frontend development.
 * Replace implementations with real axios calls to FastAPI backend when ready.
 */

import type { ListSummary, ListDetail, ListVersion } from '../types'

const STORAGE_KEY = 'mock_lists_v1'

const sampleLists: ListSummary[] = [
  {
    id: 'list-1',
    title: 'Delhi Cardiologists Q4',
    domain: 'Customer',
    owner_name: 'R. Sharma',
    version_number: 1,
    updated_at: new Date().toISOString()
  },
  {
    id: 'list-2',
    title: 'Hospital Formulary Contacts',
    domain: 'Account',
    owner_name: 'Asha Singh',
    version_number: 1,
    updated_at: new Date().toISOString()
  },
  {
    id: 'list-3',
    title: 'Event Invite - KOLs',
    domain: 'Marketing',
    owner_name: 'Team Events',
    version_number: 1,
    updated_at: new Date().toISOString()
  },
  {
    id: 'list-4',
    title: 'High Value Prescribers',
    domain: 'Data',
    owner_name: 'Analytics',
    version_number: 1,
    updated_at: new Date().toISOString()
  }
]

function readStore(): ListDetail[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) return JSON.parse(raw)
  // seed initial data
  const seed = sampleLists.map((s, i) => ({
    id: s.id,
    title: s.title,
    domain: s.domain,
    owner_name: s.owner_name,
    version_number: s.version_number,
    updated_at: s.updated_at,
    current_snapshot: {
      items: [
        { id: `item-${i}-1`, name: 'Dr. Neha Kapoor', specialty: 'Cardiology', institution: 'City Hospital', tier: 'A', email: 'neha.k@example.com' },
        { id: `item-${i}-2`, name: 'Dr. Ajay Sharma', specialty: 'Cardiology', institution: 'Metro Clinic', tier: 'B', email: 'ajay.s@example.com' }
      ]
    },
    versions: [
      {
        id: `ver-${i}-1`,
        list_id: s.id,
        version_number: 1,
        snapshot: {},
        changes_summary: { added: 2, removed: 0, updated: 0 },
        rationale: 'Initial import',
        updated_by: { id: 'u1', name: s.owner_name },
        created_at: s.updated_at
      }
    ]
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

export async function getLists(domain?: string) {
  const all = readStore()
  if (domain) return all.filter(l => l.domain === domain)
  return all
}

export async function getListDetail(id: string) {
  const all = readStore()
  const found = all.find(l => l.id === id)
  if (!found) throw new Error('Not found')
  return found
}

export async function createList(payload: { title: string; domain: string; items: any[] }) {
  const all = readStore()
  const newList: ListDetail = {
    id: 'list-' + Math.random().toString(36).slice(2,9),
    title: payload.title,
    domain: payload.domain,
    owner_name: 'You',
    version_number: 1,
    updated_at: new Date().toISOString(),
    current_snapshot: { items: payload.items },
    versions: [
      {
        id: 'ver-' + Math.random().toString(36).slice(2,9),
        list_id: 'list-new',
        version_number: 1,
        snapshot: {},
        changes_summary: { added: payload.items.length, removed: 0, updated: 0 },
        rationale: 'Initial import',
        updated_by: { id: 'you', name: 'You' },
        created_at: new Date().toISOString()
      }
    ]
  }
  all.push(newList)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return newList
}

export async function addItemsToList(id: string, items: any[]) {
  const all = readStore()
  const idx = all.findIndex(l => l.id === id)
  if (idx === -1) throw new Error('Not found')
  const list = all[idx]
  const newItems = items.map((it, i) => ({ id: `item-${Date.now()}-${i}`, ...it }))
  list.current_snapshot.items.push(...newItems)
  list.version_number = (list.version_number || 1) + 1
  list.updated_at = new Date().toISOString()
  list.versions.push({
    id: 'ver-' + Math.random().toString(36).slice(2,9),
    list_id: id,
    version_number: list.version_number,
    snapshot: {},
    changes_summary: { added: newItems.length, removed: 0, updated: 0 },
    rationale: 'Bulk upload',
    updated_by: { id: 'you', name: 'You' },
    created_at: list.updated_at
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return { added: newItems.length, version_number: list.version_number }
}

export async function deleteList(id: string) {
  const all = readStore()
  const filtered = all.filter(l => l.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return { success: true }
}

export async function resetToDefault() {
  localStorage.removeItem(STORAGE_KEY)
  return readStore()
}
