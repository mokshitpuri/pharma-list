import { useState } from 'react'
import { postListBotQuery } from '../api/listbotApi'

export function useListBotChat() {
  const [messages, setMessages] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async (domain: string, query: string) => {
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: query }])
    try {
      const res = await postListBotQuery({ domain, question: query, chat_history: messages })
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: could not reach server (mock mode).'}])
    } finally {
      setLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  return { messages, sendMessage, clearMessages, loading }
}
