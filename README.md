# E-Paper CMS

A generic platform for managing e-paper displays (ESP32 + e-paper) with a visual builder and modular architecture.

## Features

### MVP (Current)
- ✅ User authentication (email/password)
- ✅ Device management (register ESP32 displays)
- ✅ BMP image upload and conversion
- ✅ ESP32 API with ETag caching
- ✅ Screen assignment to devices

### Planned
- 📋 Visual grid builder with drag & drop
- 🧩 Modules: Clock, Weather, Prayer Times, Calendar, Todo List, QR Code, RSS
- 🎨 Pre-designed templates
- 🔄 Image carousel
- 🌐 Multi-language support

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Image Processing**: Sharp with Floyd-Steinberg dithering
- **Auth**: JWT with HTTP-only cookies, bcrypt + pepper
- **Deployment**: Docker, Dokploy

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dev-digitaldream/epaper-cms.git
cd epaper-cms
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with:
   - Supabase credentials
   - JWT secret
   - Pepper for password hashing

5. Run database migrations:
   - Go to your Supabase SQL Editor
   - Run the SQL in `migrations/001_initial_schema.sql`

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses 4 main tables:
- `users` - User accounts
- `devices` - ESP32 e-paper displays
- `screens` - Content configurations with BMP data
- `screen_devices` - Many-to-many assignments

See `migrations/001_initial_schema.sql` for full schema.

## ESP32 API

### Get Screens for Device

```
GET /api/device/{code}
Headers:
  x-device-key: {device-api-key}

Response:
{
  "screens": [
    {
      "id": "uuid",
      "name": "Screen 1",
      "duration": 30,
      "bmpData": "base64-encoded-bmp",
      "width": 400,
      "height": 300
    }
  ],
  "etag": "md5-hash",
  "timestamp": "2025-11-01T..."
}
```

### ETag Caching

The API supports ETag caching. Send `If-None-Match: {etag}` header to receive `304 Not Modified` when content hasn't changed.

## Docker Deployment

### Build

```bash
docker build -t epaper-cms .
```

### Run

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e JWT_SECRET=... \
  -e PEPPER=... \
  epaper-cms
```

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## ESP32 Firmware

The ESP32 firmware is maintained separately. It should:
1. Connect to WiFi
2. Poll `/api/device/{code}` every 15 minutes
3. Send `x-device-key` header
4. Decode base64 BMP data
5. Display on e-paper screen
6. Rotate between screens based on `duration`

Example ESP32 code coming soon.

## Project Structure

```
app/
├── api/          # API routes
│   ├── auth/     # Authentication
│   ├── devices/  # Device CRUD
│   ├── screens/  # Screen CRUD
│   └── device/   # ESP32 API
├── dashboard/    # Main dashboard
├── login/        # Login page
└── register/     # Registration page
lib/
├── supabase.ts       # Supabase client
├── auth.ts           # Auth helpers
├── imageConverter.ts # BMP conversion
└── types.ts          # TypeScript types
migrations/
└── 001_initial_schema.sql
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
