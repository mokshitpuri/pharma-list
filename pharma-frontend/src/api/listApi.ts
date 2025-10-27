/**
 * List API - Connected to FastAPI backend
 */

import axiosClient from './axiosClient'
import type { ListSummary, ListDetail, ListVersion, WorkLog } from '../types'

/**
 * Get all lists, optionally filtered by category
 */
export async function getLists(category?: string): Promise<ListSummary[]> {
  try {
    const response = await axiosClient.get('/lists', {
      params: category ? { category } : {}
    })
    return response.data
  } catch (error) {
    console.error('Error fetching lists:', error)
    throw error
  }
}

/**
 * Get detailed information for a specific list
 */
export async function getListDetail(id: string): Promise<ListDetail> {
  try {
    const response = await axiosClient.get(`/lists/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching list ${id}:`, error)
    throw error
  }
}

/**
 * Create a new list
 */
export async function createList(payload: {
  requester_name: string
  requester_role: string
  purpose: string
  category: string
}): Promise<ListSummary> {
  try {
    const response = await axiosClient.post('/lists', payload)
    return response.data
  } catch (error) {
    console.error('Error creating list:', error)
    throw error
  }
}

/**
 * Update an existing list
 */
export async function updateList(id: string, payload: {
  requester_name?: string
  requester_role?: string
  purpose?: string
  category?: string
}): Promise<ListSummary> {
  try {
    const response = await axiosClient.put(`/lists/${id}`, payload)
    return response.data
  } catch (error) {
    console.error(`Error updating list ${id}:`, error)
    throw error
  }
}

/**
 * Add items to an existing list (creates a new version)
 */
export async function addItemsToList(id: string, items: any[], updatedBy?: string): Promise<any> {
  try {
    const response = await axiosClient.post(`/lists/${id}/items`, {
      items,
      updated_by: updatedBy || 'Current User'
    })
    return response.data
  } catch (error) {
    console.error(`Error adding items to list ${id}:`, error)
    throw error
  }
}

/**
 * Delete a list
 */
export async function deleteList(id: string): Promise<{ success: boolean }> {
  try {
    await axiosClient.delete(`/lists/${id}`)
    return { success: true }
  } catch (error) {
    console.error(`Error deleting list ${id}:`, error)
    throw error
  }
}

/**
 * Get all versions for a specific list
 */
export async function getListVersions(listId: string): Promise<ListVersion[]> {
  try {
    const response = await axiosClient.get(`/versions/${listId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching versions for list ${listId}:`, error)
    throw error
  }
}

/**
 * Create a new version for a list
 */
export async function createVersion(payload: {
  list_id: string
  version_number: number
  changes_summary: string
  rationale: string
  updated_by: string
}): Promise<ListVersion> {
  try {
    const response = await axiosClient.post('/versions', payload)
    return response.data
  } catch (error) {
    console.error('Error creating version:', error)
    throw error
  }
}

/**
 * Get work logs for a specific list
 */
export async function getWorkLogs(listId: string): Promise<WorkLog[]> {
  try {
    const response = await axiosClient.get(`/worklogs/${listId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching work logs for list ${listId}:`, error)
    throw error
  }
}

/**
 * Add a work log entry
 */
export async function addWorkLog(payload: {
  list_id: string
  action: string
  performed_by: string
}): Promise<WorkLog> {
  try {
    const response = await axiosClient.post('/worklogs', payload)
    return response.data
  } catch (error) {
    console.error('Error adding work log:', error)
    throw error
  }
}

