import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListDetail, addItemsToList, deleteList, getLists } from '../api/listApi'
import CSVUploadModal from '../components/CSVUploadModal'
import Toast from '../components/Toast'
import { getDomainDisplayName, migrateDomainName, getDomainConfig } from '../constants/domains'

export default function DomainView() {
  const { domainKey } = useParams()
  const navigate = useNavigate()
  const [lists, setLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [selectedList, setSelectedList] = useState<any>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)

  const decodedDomainKey = domainKey ? decodeURIComponent(domainKey) : ''
  const domainConfig = getDomainConfig(decodedDomainKey)
  const displayDomainName = getDomainDisplayName(decodedDomainKey)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        // Fetch all lists
        const allLists = await getLists()
        
        // Filter lists by domain
        const domainLists = allLists.filter((list: any) => {
          const migratedDomain = migrateDomainName(list.category)
          return migratedDomain === decodedDomainKey
        })

        setLists(domainLists)

        // Auto-select first list if available
        if (domainLists.length > 0 && !selectedListId) {
          setSelectedListId(domainLists[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch lists:', error)
        setToast({ message: 'Failed to load lists. Please try again.', type: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [decodedDomainKey])

  useEffect(() => {
    (async () => {
      if (!selectedListId) {
        setSelectedList(null)
        return
      }
      try {
        const res = await getListDetail(selectedListId)
        setSelectedList(res)
      } catch (error) {
        console.error('Failed to fetch list detail:', error)
        setToast({ message: 'Failed to load list details.', type: 'error' })
      }
    })()
  }, [selectedListId])

  const handleDeleteList = async () => {
    if (!selectedListId) return
    try {
      await deleteList(selectedListId)
      setToast({ message: 'List deleted successfully', type: 'success' })
      
      // Remove from local lists
      const updatedLists = lists.filter(l => l.id !== selectedListId)
      setLists(updatedLists)
      
      // Select next available list or clear selection
      if (updatedLists.length > 0) {
        setSelectedListId(updatedLists[0].id)
      } else {
        setSelectedListId(null)
        setSelectedList(null)
      }
      
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete list:', error)
      setToast({ message: 'Failed to delete list. Please try again.', type: 'error' })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary animate-spin border-4 border-transparent border-t-white"></div>
        <p className="text-slate-600 font-medium">Loading domain lists...</p>
      </div>
    </div>
  )

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

  // Get display data from selected list
  const displayTitle = selectedList?.purpose || selectedList?.title || 'Select a list'
  const displayOwner = selectedList?.requester_name || selectedList?.owner_name || 'Unknown'
  const items = selectedList?.current_snapshot?.items || []

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
              {selectedListId && (
                <>
                  <button 
                    onClick={() => setUploadOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Bulk Upload
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete List
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* List Selector Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Select List to View</label>
            <div className="relative">
              <select
                value={selectedListId || ''}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full h-14 pl-4 pr-12 appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all duration-200 cursor-pointer text-lg"
                disabled={lists.length === 0}
              >
                {lists.length === 0 ? (
                  <option value="">No lists available in this domain</option>
                ) : (
                  lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.purpose || list.title || 'Untitled List'} - {list.requester_name || 'Unknown'}
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
            {lists.length > 0 && (
              <p className="mt-3 text-sm text-slate-500">
                Viewing {lists.findIndex(l => l.id === selectedListId) + 1} of {lists.length} list{lists.length !== 1 ? 's' : ''} in {displayDomainName}
              </p>
            )}
          </div>
        </div>

        {/* List Details - Only show if a list is selected */}
        {selectedList ? (
          <>
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {displayOwner}
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-slate-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                    {displayTitle}
                  </h1>
                  <p className="text-slate-500 text-lg">
                    {items.length} items in this pharmaceutical list
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">Total Items</div>
                      <div className="text-3xl font-bold text-slate-800">{items.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">Category</div>
                      <div className="text-xl font-bold text-slate-800">{displayDomainName}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center">
                      <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-500 mb-1">Lists in Domain</div>
                      <div className="text-3xl font-bold text-slate-800">{lists.length}</div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/10 to-success/5 flex items-center justify-center">
                      <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">List Items</h2>
              </div>
              
              {items.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No items yet</h3>
                  <p className="text-slate-500 mb-4">Upload a CSV file to add items to this list</p>
                  <button 
                    onClick={() => setUploadOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload CSV
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Specialty</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Institution</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it: any, index: number) => (
                        <tr 
                          key={it.id || index} 
                          className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-colors duration-200 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-primary mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="text-sm font-semibold text-slate-800">{it.name || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-full">
                              {it.specialty || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{it.institution || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full border border-primary/20">
                              {it.tier || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No lists in this domain yet</h3>
            <p className="text-slate-500">Create a new list to get started</p>
          </div>
        )}
      </main>

      {/* CSV Upload Modal */}
      {uploadOpen && selectedListId && (
        <CSVUploadModal 
          onClose={() => setUploadOpen(false)} 
          onAdd={async (rows: any) => {
            try {
              await addItemsToList(selectedListId!, rows)
              const updated = await getListDetail(selectedListId!)
              setSelectedList(updated)
              setUploadOpen(false)
              setToast({ message: 'Items added successfully!', type: 'success' })
            } catch (error) {
              console.error('Failed to add items:', error)
              setToast({ message: 'Failed to add items. Please try again.', type: 'error' })
            }
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete List</h3>
              <p className="text-slate-600">
                Are you sure you want to delete <span className="font-semibold">"{displayTitle}"</span>? This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                className="flex-1 h-12 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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
