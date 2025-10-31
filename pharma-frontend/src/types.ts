/**
 * Type definitions matching backend API schemas
 */

import { DomainKey } from './constants/domains'

// List Request (maps to list_requests table in Supabase)
export type ListSummary = {
  request_id: number
  subdomain_id: number
  requester_name: string
  request_purpose: string
  status?: string
  assigned_to?: string
  created_at: string
  // Optional joined data
  subdomain?: {
    subdomain_id: number
    domain_id: number
    subdomain_name: string
  }
}

export type ListDetail = ListSummary & {
  // Additional fields from joined data
  current_version?: ListVersion
  versions?: ListVersion[]
  current_snapshot?: {
    items: any[]
  }
}

// List Version (from list_versions table)
export type ListVersion = {
  version_id: number
  request_id: number
  version_number: number
  changes_summary?: string
  rationale?: string
  updated_by: string
  created_at: string
}

// Work Log (from work_logs table)
export type WorkLog = {
  log_id?: number
  request_id: number
  version_id?: number
  worker_name: string
  activity_description: string
  decisions_made?: string
  activity_date?: string
  // Optional joined data from list_requests
  list_requests?: {
    request_id: number
    subdomain_id: number
    requester_name: string
    request_purpose: string
    status?: string
    subdomains?: {
      subdomain_id: number
      domain_id: number
      subdomain_name: string
    }
  }
}

// Subdomain (from subdomains table)
export type Subdomain = {
  subdomain_id: number
  domain_id: number
  subdomain_name: string
}

// Domain (from domains table)
export type Domain = {
  domain_id: number
  domain_name: string
  created_at?: string
}

