import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

const createDeviceSchema = z.object({
  name: z.string().min(1),
  width: z.number().optional().default(400),
  height: z.number().optional().default(300),
  rotation: z.number().optional().default(0),
})

// GET /api/devices - List all devices for current user
export async function GET() {
  try {
    const user = await requireAuth()

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ devices: data || [] })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/devices - Create new device
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, width, height, rotation } = createDeviceSchema.parse(body)

    // Generate unique code and API key
    const code = `D-${crypto.randomBytes(4).toString('hex')}`
    const api_key = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabase
      .from('devices')
      .insert({
        user_id: user.id,
        name,
        code,
        api_key,
        width,
        height,
        rotation,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ device: data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Create device error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
