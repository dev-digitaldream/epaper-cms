-- E-Paper CMS - Initial Schema
-- Run this SQL in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices table (ESP32 e-paper displays)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- Short code for ESP32 to use
  api_key VARCHAR(255) UNIQUE NOT NULL,
  width INTEGER DEFAULT 400,
  height INTEGER DEFAULT 300,
  rotation INTEGER DEFAULT 0, -- 0, 90, 180, 270
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screens table (content configurations)
CREATE TABLE IF NOT EXISTS screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  bmp_data TEXT, -- Base64 encoded BMP
  preview_url TEXT,
  duration INTEGER DEFAULT 30, -- Seconds to display
  active BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screen to Device assignments (many-to-many)
CREATE TABLE IF NOT EXISTS screen_devices (
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (screen_id, device_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_code ON devices(code);
CREATE INDEX IF NOT EXISTS idx_devices_api_key ON devices(api_key);
CREATE INDEX IF NOT EXISTS idx_screens_user_id ON screens(user_id);
CREATE INDEX IF NOT EXISTS idx_screens_active ON screens(active);
CREATE INDEX IF NOT EXISTS idx_screen_devices_device_id ON screen_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_screen_devices_screen_id ON screen_devices(screen_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY devices_own_data ON devices FOR ALL USING (user_id = auth.uid());
CREATE POLICY screens_own_data ON screens FOR ALL USING (user_id = auth.uid());
CREATE POLICY screen_devices_own_data ON screen_devices FOR ALL USING (
  device_id IN (SELECT id FROM devices WHERE user_id = auth.uid())
);
