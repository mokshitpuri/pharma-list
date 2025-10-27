import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSubdomains } from '../api/listApi'
import CSVUploadModal from '../components/CSVUploadModal'
import Toast from '../components/Toast'
import { getDomainDisplayName, getDomainConfig } from '../constants/domains'
import axiosClient from '../api/axiosClient'
import { downloadSampleCSV, getListTypeFromSubdomain } from '../utils/csvTemplates'

interface Subdomain {
  subdomain_id: number
  domain_id: number
  subdomain_name: string
}

interface SubdomainEntry {
  entry_id: number
  [key: string]: any
}

export default function DomainView() {
  const { domainKey } = useParams()
  const navigate = useNavigate()
  const [subdomains, setSubdomains] = useState<Subdomain[]>([])
  const [selectedSubdomain, setSelectedSubdomain] = useState<Subdomain | null>(null)
  const [entries, setEntries] = useState<SubdomainEntry[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const decodedDomainKey = domainKey ? decodeURIComponent(domainKey) : ''
  const domainConfig = getDomainConfig(decodedDomainKey)
  const displayDomainName = getDomainDisplayName(decodedDomainKey)

  // Map subdomain names to their corresponding entry table names
  const getEntryTableName = (subdomainName: string): string | null => {
    const tableMapping: Record<string, string> = {
      'Target Lists': 'target_list_entries',
      'Call Lists': 'call_list_entries',
      'Formulary Decision-Maker Lists': 'formulary_decision_maker_entries',
      'IDN/Health System Lists': 'idn_health_system_entries',
      'Event Invitation Lists': 'event_invitation_entries',
      'Digital Engagement Lists': 'digital_engagement_entries',
      'High-Value Prescriber Lists': 'high_value_prescriber_entries',
      'Competitor Target Lists': 'competitor_target_entries'
    }
    return tableMapping[subdomainName] || null
  }

  // Fetch entries function wrapped in useCallback
  const fetchEntries = useCallback(async () => {
    if (!selectedSubdomain) {
      setEntries([])
      return
    }
    
    try {
      setEntriesLoading(true)
      const tableName = getEntryTableName(selectedSubdomain.subdomain_name)
      
      if (!tableName) {
        setToast({ message: `Unknown subdomain type: ${selectedSubdomain.subdomain_name}`, type: 'error' })
        setEntries([])
        return
      }

      // Fetch entries from the appropriate table
      const response = await axiosClient.get(`/api/${tableName}`)
      setEntries(response.data || [])
    } catch (error) {
      console.error('Failed to fetch entries for subdomain:', error)
      setToast({ message: 'Failed to load entries. Please try again.', type: 'error' })
      setEntries([])
    } finally {
      setEntriesLoading(false)
    }
  }, [selectedSubdomain])

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchEntries()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Fetch subdomains for the selected domain
  useEffect(() => {
    (async () => {
      if (!domainConfig) return
      
      try {
        setLoading(true)
        const fetchedSubdomains = await getSubdomains(domainConfig.domainId)
        setSubdomains(fetchedSubdomains)

        // Auto-select first subdomain if available
        if (fetchedSubdomains.length > 0) {
          setSelectedSubdomain(fetchedSubdomains[0])
        }
      } catch (error) {
        console.error('Failed to fetch subdomains:', error)
        setToast({ message: 'Failed to load subdomains. Please try again.', type: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [decodedDomainKey, domainConfig])

  // Fetch entries when subdomain is selected
  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  // Auto-refresh polling every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      void fetchEntries()
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(pollInterval)
  }, [fetchEntries])

  const handleUploadComplete = async (uploadedItems: any[]) => {
    // Refresh entries after upload
    if (selectedSubdomain) {
      const tableName = getEntryTableName(selectedSubdomain.subdomain_name)
      if (tableName) {
        try {
          const response = await axiosClient.get(`/api/${tableName}`)
          setEntries(response.data || [])
          setToast({ message: 'Items uploaded successfully!', type: 'success' })
        } catch (error) {
          setToast({ message: 'Items uploaded but failed to refresh list.', type: 'warning' })
        }
      }
    }
    setUploadOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary animate-spin border-4 border-transparent border-t-white"></div>
          <p className="text-slate-600 font-medium">Loading domain...</p>
        </div>
      </div>
    )
  }

  if (!domainConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">Domain not found</h3>
          <p className="text-slate-500 mb-4">The domain you're looking for doesn't exist</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Get column names for the current entry type
  const getColumnNames = (): string[] => {
    if (!entries || entries.length === 0) return []
    const firstEntry = entries[0]
    return Object.keys(firstEntry).filter(key => key !== 'entry_id' && key !== 'version_id' && key !== 'created_at')
  }

  const columns = getColumnNames()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              
              {/* Domain Badge */}
              <div className="px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary text-sm tracking-wider uppercase font-semibold rounded-lg border border-primary/20">
                {displayDomainName}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200 disabled:opacity-50"
                title="Refresh entries"
              >
                <svg 
                  className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {selectedSubdomain && (
                <>
                  <button 
                    onClick={() => {
                      const listType = selectedSubdomain.subdomain_name;
                      const templateType = getListTypeFromSubdomain(listType);
                      if (templateType) {
                        downloadSampleCSV(templateType);
                        setToast({ message: 'Sample CSV downloaded successfully!', type: 'success' });
                      } else {
                        setToast({ message: 'No sample template available for this list type', type: 'warning' });
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    title="Download sample CSV template"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Sample CSV
                  </button>
                  <button 
                    onClick={() => setUploadOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Bulk Upload
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Subdomain Selector Section */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Select Subdomain</label>
            <div className="relative">
              <select
                value={selectedSubdomain?.subdomain_id || ''}
                onChange={(e) => {
                  const subdomain = subdomains.find(s => s.subdomain_id === Number(e.target.value))
                  setSelectedSubdomain(subdomain || null)
                }}
                className="w-full h-14 pl-4 pr-12 appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all duration-200 cursor-pointer text-lg"
                disabled={subdomains.length === 0}
              >
                {subdomains.length === 0 ? (
                  <option value="">No subdomains available in this domain</option>
                ) : (
                  subdomains.map((subdomain) => (
                    <option key={subdomain.subdomain_id} value={subdomain.subdomain_id}>
                      {subdomain.subdomain_name}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {subdomains.length > 0 && (
              <p className="mt-3 text-sm text-slate-500">
                {subdomains.length} subdomain{subdomains.length !== 1 ? 's' : ''} available in {displayDomainName}
              </p>
            )}
          </div>
        </div>

        {/* Entries Table */}
        {selectedSubdomain && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedSubdomain.subdomain_name}</h2>
                  <p className="text-slate-500 mt-1">
                    {entriesLoading ? 'Loading...' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
                  </p>
                </div>
              </div>
            </div>

            {entriesLoading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary animate-spin border-4 border-transparent border-t-white"></div>
                <p className="text-slate-600">Loading entries...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No entries yet</h3>
                <p className="text-slate-500 mb-4">Upload a CSV file to add entries to this list</p>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Upload CSV
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {columns.map((column) => (
                        <th key={column} className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          {column.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((entry) => (
                      <tr key={entry.entry_id} className="hover:bg-slate-50 transition-colors">
                        {columns.map((column) => (
                          <td key={column} className="px-6 py-4 text-sm text-slate-700">
                            {entry[column] !== null && entry[column] !== undefined ? String(entry[column]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CSV Upload Modal */}
      {selectedSubdomain && (
        <CSVUploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onComplete={handleUploadComplete}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
