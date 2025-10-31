import React, { useState, useEffect } from 'react'
import Toast from './Toast'

interface InlineAddEntryProps {
  columns: string[]
  tableName: string
  onEntryAdded: () => void
  onAddingStateChange?: (isAdding: boolean) => void
  showAsButton?: boolean
}

export default function InlineAddEntry({ columns, tableName, onEntryAdded, onAddingStateChange, showAsButton = false }: InlineAddEntryProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Notify parent when adding state changes
  useEffect(() => {
    if (onAddingStateChange) {
      onAddingStateChange(isAdding)
    }
  }, [isAdding, onAddingStateChange])

  const handleInputChange = (column: string, value: string) => {
    setFormData(prev => ({ ...prev, [column]: value }))
  }

  const handleAddRow = () => {
    setIsAdding(true)
    // Initialize form data with empty strings for all columns
    const initialData: Record<string, string> = {}
    columns.forEach(col => {
      initialData[col] = ''
    })
    setFormData(initialData)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setFormData({})
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Remove empty fields
      const dataToSend = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== '')
      )

      if (Object.keys(dataToSend).length === 0) {
        setToast({ message: 'Please fill in at least one field', type: 'warning' })
        setIsSaving(false)
        return
      }

      console.log('[DEBUG] Sending data to:', `http://localhost:8000/api/${tableName}`)
      console.log('[DEBUG] Data:', dataToSend)

      const response = await fetch(`http://localhost:8000/api/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('[ERROR] Server response:', errorData)
        throw new Error(errorData.detail || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('[SUCCESS] Entry added:', result)

      setToast({ message: 'Entry added successfully!', type: 'success' })
      setIsAdding(false)
      setFormData({})
      onEntryAdded() // Refresh the table
    } catch (error) {
      console.error('[ERROR] Error adding entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add entry. Please try again.'
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  // Format column header: contact_name -> Contact Name
  const formatColumnHeader = (key: string) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // If showing as button only (for top-right placement), return just the button
  if (showAsButton && !isAdding) {
    return (
      <button
        onClick={handleAddRow}
        className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Add New Entry
      </button>
    )
  }

  return (
    <>
      {!isAdding ? (
        showAsButton ? null : (
          <div className="p-6 flex justify-center">
            <button
              onClick={handleAddRow}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Entry
            </button>
          </div>
        )
      ) : (
        <div className="border-t-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Adding New Entry
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Mark Done
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map((column) => (
                <div key={column}>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">
                    {formatColumnHeader(column)}
                  </label>
                  <input
                    type="text"
                    value={formData[column] || ''}
                    onChange={(e) => handleInputChange(column, e.target.value)}
                    placeholder={`Enter ${formatColumnHeader(column).toLowerCase()}`}
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                  />
                </div>
              ))}
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
    </>
  )
}
