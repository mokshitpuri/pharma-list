/**
 * ListBot API - Connected to FastAPI backend for conversational queries
 */

import axiosClient from './axiosClient'

export interface ListBotQueryRequest {
  domain?: string
  question: string
  list_id?: string
  chat_history?: any[]
}

export interface ListBotQueryResponse {
  answer: string
  sources?: any[]
}

/**
 * Send a query to the ListBot conversational interface
 */
export const postListBotQuery = async (data: ListBotQueryRequest): Promise<ListBotQueryResponse> => {
  try {
    const response = await axiosClient.post('/query', {
      question: data.question
    })
    return response.data
  } catch (error) {
    console.error('Error querying ListBot:', error)
    throw error
  }
}

