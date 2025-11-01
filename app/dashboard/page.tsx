'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Device } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    loadDevices()
  }, [])

  const checkAuth = async () => {
    const res = await fetch('/api/auth/me')
    if (!res.ok) {
      router.push('/login')
      return
    }
    const data = await res.json()
    setUser(data.user)
  }

  const loadDevices = async () => {
    try {
      const res = await fetch('/api/devices')
      if (res.ok) {
        const data = await res.json()
        setDevices(data.devices)
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDevice = async () => {
    const name = prompt('Enter device name:')
    if (!name) return

    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        loadDevices()
      } else {
        alert('Failed to create device')
      }
    } catch (error) {
      alert('Error creating device')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">E-Paper CMS</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Devices</h2>
            <p className="text-gray-600 mt-1">Manage your e-paper displays</p>
          </div>
          <Button onClick={createDevice}>Add Device</Button>
        </div>

        {devices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No devices yet</p>
              <Button onClick={createDevice}>Create your first device</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardHeader>
                  <CardTitle>{device.name}</CardTitle>
                  <CardDescription>
                    {device.width}x{device.height} pixels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Device Code</p>
                    <p className="font-mono text-sm">{device.code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">API Key</p>
                    <p className="font-mono text-xs truncate">{device.api_key}</p>
                  </div>
                  {device.last_sync && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Sync</p>
                      <p className="text-sm">{new Date(device.last_sync).toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>Get started with your e-paper displays</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Create a Device</h4>
                <p className="text-sm text-gray-600">
                  Click "Add Device" to register a new e-paper display. You'll get a device code and API key.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">2. Configure Your ESP32</h4>
                <p className="text-sm text-gray-600">
                  Use the device code and API key in your ESP32 firmware to connect to the API.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">3. Upload Screens</h4>
                <p className="text-sm text-gray-600">
                  Coming soon: Upload PNG images that will be automatically converted to BMP format.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">4. ESP32 API Endpoint</h4>
                <p className="text-sm text-gray-600 font-mono">
                  GET /api/device/[code]
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Header: x-device-key: [api_key]
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
