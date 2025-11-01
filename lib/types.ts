// Database types
export interface User {
  id: string
  email: string
  password_hash: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Device {
  id: string
  user_id: string
  name: string
  code: string // Short code like "D-001"
  api_key: string
  width: number
  height: number
  rotation: number
  last_sync?: string
  created_at: string
  updated_at: string
}

export interface Screen {
  id: string
  user_id: string
  name: string
  description?: string
  bmp_data?: string // Base64 encoded BMP
  preview_url?: string
  duration: number // Seconds
  active: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface ScreenDevice {
  screen_id: string
  device_id: string
  active: boolean
  assigned_at: string
}

// API request/response types
export interface CreateDeviceRequest {
  name: string
  width?: number
  height?: number
  rotation?: number
}

export interface CreateScreenRequest {
  name: string
  description?: string
  duration?: number
  active?: boolean
}

export interface ESP32ScreenResponse {
  id: string
  name: string
  duration: number
  bmpData: string
  width: number
  height: number
}

export interface ESP32ApiResponse {
  screens: ESP32ScreenResponse[]
  etag: string
  timestamp: string
}
