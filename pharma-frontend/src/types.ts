/**
 * Type definitions matching backend API schemas
 */

import { DomainKey } from './constants/domains'

// List Request (from backend schema)
export type ListSummary = {
  id: string
  requester_name: string
  requester_role: string
  purpose: string
  category: DomainKey | string // Supports both new and legacy domain names
  created_at: string
}

export type ListDetail = ListSummary & {
  // Additional fields can be added as backend expands
  versions?: ListVersion[]
  current_snapshot?: {
    items: any[]
  }
}

// List Version (from backend schema)
export type ListVersion = {
  id: string
  list_id: string
  version_number: number
  changes_summary: string
  rationale: string
  updated_by: string
  updated_at: string
}

// Work Log (from backend schema)
export type WorkLog = {
  id: string
  list_id: string
  action: string
  performed_by: string
  timestamp: string
}


