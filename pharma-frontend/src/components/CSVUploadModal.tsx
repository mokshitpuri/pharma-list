import React, { useState } from 'react'
import Papa from 'papaparse'
import Toast from './Toast'

export default function CSVUploadModal({ onClose, onAdd }: any) {
  const [rows, setRows] = useState<any[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null)

  const downloadSampleCSV = () => {
    // Sample data with pharmaceutical professional details
    const sampleData = [
      {
        id: 'DOC001',
        name: 'Dr. Rajesh Kumar',
        designation: 'Senior Consultant',
        specialty: 'Cardiology',
        institution: 'Apollo Hospital',
        location: 'Delhi',
        phone: '+91-9876543210',
        email: 'rajesh.kumar@apollo.com',
        tier: 'A',
        remarks: 'Key opinion leader in interventional cardiology'
      },
      {
        id: 'DOC002',
        name: 'Dr. Priya Sharma',
        designation: 'Head of Department',
        specialty: 'Neurology',
        institution: 'Fortis Healthcare',
        location: 'Mumbai',
        phone: '+91-9876543211',
        email: 'priya.sharma@fortis.com',
        tier: 'A',
        remarks: 'Specializes in stroke management'
      },
      {
        id: 'DOC003',
        name: 'Dr. Amit Patel',
        designation: 'Consultant',
        specialty: 'Orthopedics',
        institution: 'Max Hospital',
        location: 'Bangalore',
        phone: '+91-9876543212',
        email: 'amit.patel@max.com',
        tier: 'B',
        remarks: 'Sports injury specialist'
      },
      {
        id: 'DOC004',
        name: 'Dr. Sneha Reddy',
        designation: 'Associate Professor',
        specialty: 'Oncology',
        institution: 'AIIMS',
        location: 'Delhi',
        phone: '+91-9876543213',
        email: 'sneha.reddy@aiims.edu',
        tier: 'A',
        remarks: 'Research focus on breast cancer'
      },
      {
        id: 'DOC005',
        name: 'Dr. Vikram Singh',
        designation: 'Consultant',
        specialty: 'Gastroenterology',
        institution: 'Medanta',
        location: 'Gurugram',
        phone: '+91-9876543214',
        email: 'vikram.singh@medanta.com',
        tier: 'B',
        remarks: 'Expert in liver diseases'
      }
    ]

    // Convert to CSV using Papa Parse
    const csv = Papa.unparse(sampleData)
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_pharma_data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFile = (file: File | null) => {
    if (!file) return
    const name = file.name.toLowerCase()
    // Basic Excel guard: XLSX/XLS not supported client-side yet
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      // You can add SheetJS (xlsx) to support Excel files in the future.
      // For now, show a toast notification and return.
      setToast({ message: 'Excel files (.xls/.xlsx) are not supported yet. Please upload a CSV.', type: 'warning' });
      return
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data as any[])
        setSelected({})
      }
    })
  }

  const toggleRow = (i: number) => {
    setSelected(s => ({ ...s, [i]: !s[i] }))
  }

  const addSelected = () => {
    const chosen = rows.filter((r, i) => selected[i] !== false) // default include
    onAdd(chosen)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="w-full max-w-6xl relative z-10 animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-slate-200">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Import Data</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Upload CSV file to add items to your list</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* File Upload Area */}
            <div className="mb-6">
              <label className="block w-full group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv,text/csv" 
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  className="hidden" 
                />
                <div className="relative overflow-hidden p-10 border-2 border-dashed border-slate-300 hover:border-primary/50 rounded-2xl transition-all duration-300 bg-gradient-to-br from-slate-50 to-transparent group-hover:from-primary/5 group-hover:to-secondary/5">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-slate-800 mb-2">
                      {rows.length > 0 ? `${rows.length} rows loaded` : 'Drop your CSV file here'}
                    </div>
                    <span className="text-slate-500 text-sm">or click to browse your files</span>
                  </div>
                </div>
              </label>

              {/* Sample Data Button */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Sample CSV
                </button>
                <p className="text-xs text-slate-500 mt-2">
                  Not sure what format to use? Download our sample file with proper headers
                </p>
              </div>
            </div>

            {/* Table Preview */}
            {rows.length > 0 && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <div className="px-6 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Preview & Select Items</h4>
                </div>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="w-12 px-4 py-3">
                          <div className="flex justify-center">
                            <div className="w-5 h-5 rounded-md border-2 border-primary/30 bg-primary/5 flex items-center justify-center">
                              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </th>
                        {rows[0] && Object.keys(rows[0]).map((h: any) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r, i) => (
                        <tr 
                          key={i} 
                          className={`transition-all duration-200 ${selected[i] !== false ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-4 py-3 w-12">
                            <div className="flex justify-center">
                              <input 
                                type="checkbox" 
                                checked={selected[i] !== false} 
                                onChange={() => toggleRow(i)}
                                className="w-4 h-4 rounded border-2 border-slate-300 text-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" 
                              />
                            </div>
                          </td>
                          {Object.values(r).map((v: any, j: number) => (
                            <td key={j} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                              {String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {rows.length > 0 && (
                <span className="font-medium">
                  {Object.values(selected).filter(v => v !== false).length} of {rows.length} items selected
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={addSelected} 
                disabled={rows.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Add Selected Items
              </button>
            </div>
          </div>
        </div>
      </div>

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
