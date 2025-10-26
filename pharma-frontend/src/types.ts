export type ListSummary = {
  id: string
  title: string
  domain: string
  owner_name: string
  version_number: number
  updated_at: string
}

export type ListDetail = {
  id: string
  title: string
  domain: string
  owner_name: string
  version_number: number
  updated_at: string
  current_snapshot: {
    items: any[]
  }
  versions: ListVersion[]
}

export type ListVersion = {
  id: string
  list_id: string
  version_number: number
  snapshot: any
  changes_summary: { added: number; removed: number; updated: number }
  rationale: string
  updated_by: { id: string; name: string }
  created_at: string
}
