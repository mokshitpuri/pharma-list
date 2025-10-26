import React from 'react'
import { Link } from 'react-router-dom'

export default function ListCard({ list }: { list: any }) {
  return (
    <div className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      {/* Gradient accent on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary text-xs tracking-wider uppercase font-semibold rounded-lg border border-primary/20">
              {list.domain}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>v{list.version_number}</span>
            </div>
          </div>
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-success shadow-lg shadow-success/50 animate-pulse"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success animate-ping opacity-75"></div>
          </div>
        </div>
        
        <div className="flex-1 mb-5">
          <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {list.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2">
            Pharmaceutical data list for {list.domain.toLowerCase()} management
          </p>
        </div>
        
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <Link 
            to={`/list/${list.id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View</span>
          </Link>
          <Link 
            to={`/list/${list.id}/history`}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
