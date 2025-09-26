import { useCentro } from '../contexts/CentroContext'
import { config } from '../config/env'

const API_BASE_URL = config.apiUrl

export const useCentroApi = () => {
  const { getCentroHeaders, centroId } = useCentro()

  const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      ...getCentroHeaders(),
      ...options.headers,
    }
    
    console.log('🌐 CentroApi Request:', {
      url,
      endpoint,
      headers,
      method: options.method || 'GET',
      centroId
    })
    
    const response = await fetch(url, {
      headers,
      ...options,
    })

    console.log('📡 CentroApi Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ CentroApi Error response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ CentroApi Response data:', data)
    return data
  }

  return {
    request,
    centroId,
    getCentroHeaders
  }
}
