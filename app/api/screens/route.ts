import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { convertToBMP, bmpToBase64 } from '@/lib/imageConverter'

const createScreenSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().optional().default(30),
  active: z.boolean().optional().default(true),
  deviceId: z.string().optional(), // Auto-assign to device if provided
})

// GET /api/screens - List all screens for current user
export async function GET() {
  try {
    const user = await requireAuth()

    const { data, error } = await supabase
      .from('screens')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ screens: data || [] })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get screens error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/screens/upload - Create screen with image upload
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()

    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const duration = parseInt(formData.get('duration') as string) || 30
    const active = formData.get('active') === 'true'
    const deviceId = formData.get('deviceId') as string | null
    const imageFile = formData.get('image') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    let bmpData: string | null = null

    // If image is provided, convert to BMP
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

      // Default dimensions (can be customized per device later)
      const bmpBuffer = await convertToBMP(imageBuffer, 400, 300)
      bmpData = bmpToBase64(bmpBuffer)
    }

    // Create screen
    const { data: screen, error: screenError } = await supabase
      .from('screens')
      .insert({
        user_id: user.id,
        name,
        description,
        duration,
        active,
        bmp_data: bmpData,
      })
      .select()
      .single()

    if (screenError) throw screenError

    // If deviceId provided, assign screen to device
    if (deviceId && screen) {
      await supabase
        .from('screen_devices')
        .insert({
          screen_id: screen.id,
          device_id: deviceId,
          active: true,
        })
    }

    return NextResponse.json({ screen })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create screen error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
