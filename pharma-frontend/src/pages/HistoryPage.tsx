import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getListDetail } from '../api/listApi'

export default function HistoryPage() {
  const { id } = useParams()
  const [list, setList] = useState<any>(null)

  useEffect(() => {
    (async () => {
      if (!id) return
      const res = await getListDetail(id)
      setList(res)
    })()
  }, [id])

  if (!list) return <div>Loading...</div>

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">History - {list.title}</h2>
      <div className="space-y-4">
        {list.versions.map((v: any) => (
          <div key={v.id} className="p-4 bg-white rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">v{v.version_number} · {new Date(v.created_at).toLocaleString()}</div>
                <div className="text-lg font-medium">{v.rationale}</div>
                <div className="text-sm text-gray-600">By {v.updated_by?.name}</div>
              </div>
              <div>
                <div className="text-sm">+{v.changes_summary.added} −{v.changes_summary.removed}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
