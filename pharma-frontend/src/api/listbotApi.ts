import axios from './axiosClient'

export const postListBotQuery = async (data: { domain: string; query: string; list_id?: string; chat_history?: any[] }) => {
  // For now we call a mock endpoint (backend will replace)
  try {
    const res = await axios.post('/listbot/query', data)
    return res.data
  } catch (err) {
    // Mock fallback
    return {
      answer: `Mock answer for domain ${data.domain}: we found no backend. (Replace with real API at /api/listbot/query)`,
      sources: []
    }
  }
}
