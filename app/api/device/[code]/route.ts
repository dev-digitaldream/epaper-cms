import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'
import type { ESP32ApiResponse } from '@/lib/types'

/**
 * ESP32 Device API
 * GET /api/device/:code
 * Headers: x-device-key: <device-api-key>
 *
 * Returns all active screens assigned to this device
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code
    const deviceKey = request.headers.get('x-device-key')

    if (!deviceKey) {
      return NextResponse.json({ error: 'Missing x-device-key header' }, { status: 401 })
    }

    // Find device by code and verify API key
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('*')
      .eq('code', code)
      .eq('api_key', deviceKey)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Invalid device credentials' }, { status: 401 })
    }

    // Get all active screens assigned to this device
    const { data: screenDevices, error: screenDevicesError } = await supabase
      .from('screen_devices')
      .select(`
        screen_id,
        screens (
          id,
          name,
          bmp_data,
          duration
        )
      `)
      .eq('device_id', device.id)
      .eq('active', true)

    if (screenDevicesError) throw screenDevicesError

    // Format response for ESP32
    const screens = (screenDevices || [])
      .filter((sd: any) => sd.screens && sd.screens.bmp_data)
      .map((sd: any) => ({
        id: sd.screens.id,
        name: sd.screens.name,
        duration: sd.screens.duration,
        bmpData: sd.screens.bmp_data,
        width: device.width,
        height: device.height,
      }))

    // Generate ETag for caching
    const etag = crypto
      .createHash('md5')
      .update(JSON.stringify(screens))
      .digest('hex')

    // Check if client has cached version
    const clientETag = request.headers.get('if-none-match')
    if (clientETag === etag) {
      return new NextResponse(null, { status: 304 })
    }

    // Update last_sync timestamp
    await supabase
      .from('devices')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', device.id)

    const response: ESP32ApiResponse = {
      screens,
      etag,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    })
  } catch (error) {
    console.error('ESP32 API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
