# 🚀 Using Garmin API with Next.js

## Backend Setup (Python Flask)

1. **Install dependencies:**
```bash
pip install -r requirements-api.txt
```

2. **Start the API server:**
```bash
python api_server.py
```

The server will run on `http://localhost:5000`

## Frontend Setup (Next.js)

### Example 1: Fetch Today's Stats

```typescript
// app/api/garmin/stats/route.ts (Next.js App Router)
export async function GET() {
  try {
    const response = await fetch('http://localhost:5000/api/stats/today');
    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

```typescript
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface GarminStats {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  floors: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<GarminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/garmin/stats');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Today's Activity</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Steps</p>
          <p className="text-3xl font-bold">{stats?.steps.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Calories</p>
          <p className="text-3xl font-bold">{stats?.calories}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Distance</p>
          <p className="text-3xl font-bold">
            {(stats?.distance || 0 / 1000).toFixed(2)} km
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600">Floors</p>
          <p className="text-3xl font-bold">{stats?.floors}</p>
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Fetch Heart Rate Data

```typescript
// lib/garmin.ts
export async function getHeartRate(date?: string) {
  const endpoint = date
    ? `http://localhost:5000/api/heartrate/date/${date}`
    : 'http://localhost:5000/api/heartrate/today';

  const response = await fetch(endpoint);
  return response.json();
}

export async function getUserInfo() {
  const response = await fetch('http://localhost:5000/api/user');
  return response.json();
}

export async function getActivities(limit = 10) {
  const response = await fetch(`http://localhost:5000/api/activities?limit=${limit}`);
  return response.json();
}

export async function getHydration() {
  const response = await fetch('http://localhost:5000/api/hydration/today');
  return response.json();
}
```

### Example 3: Login Component

```typescript
// components/GarminLogin.tsx
'use client';

import { useState } from 'react';

export default function GarminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Login successful! Tokens saved.');
        // Redirect or update state
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Is the Python server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Login to Garmin</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Example 4: Server-Side Data Fetching (Next.js App Router)

```typescript
// app/stats/page.tsx
async function getStats() {
  const res = await fetch('http://localhost:5000/api/stats/today', {
    cache: 'no-store' // Always fetch fresh data
  });

  if (!res.ok) {
    throw new Error('Failed to fetch stats');
  }

  return res.json();
}

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <div>
      <h1>Today's Stats</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
```

## Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/login` | Login with credentials |
| GET | `/api/user` | Get user info |
| GET | `/api/stats/today` | Today's stats |
| GET | `/api/stats/date/:date` | Stats for specific date |
| GET | `/api/heartrate/today` | Today's heart rate |
| GET | `/api/heartrate/date/:date` | Heart rate for date |
| GET | `/api/activities?limit=10` | Recent activities |
| GET | `/api/hydration/today` | Today's hydration |
| GET | `/api/sleep/today` | Today's sleep data |
| GET | `/api/stress/today` | Today's stress data |
| GET | `/api/body-composition` | Body composition |

## Environment Variables (Optional)

Create a `.env.local` in your Next.js project:

```bash
NEXT_PUBLIC_GARMIN_API_URL=http://localhost:5000
```

Then use it:

```typescript
const API_URL = process.env.NEXT_PUBLIC_GARMIN_API_URL || 'http://localhost:5000';

async function fetchStats() {
  const res = await fetch(`${API_URL}/api/stats/today`);
  return res.json();
}
```

## Production Deployment

For production, you'll need to:

1. Deploy the Python Flask API (e.g., on Railway, Render, or Heroku)
2. Update `NEXT_PUBLIC_GARMIN_API_URL` to your production API URL
3. Set up proper authentication and security (API keys, JWT, etc.)
4. Consider rate limiting and caching

## Troubleshooting

**Python server not starting?**
```bash
# Install dependencies
pip install -r requirements-api.txt

# Run the server
python api_server.py
```

**CORS errors?**
- The Flask server already has CORS enabled with `flask-cors`
- Make sure the server is running on port 5000

**401 Authentication errors?**
- Call `POST /api/login` first with your Garmin credentials
- Or run `python example.py` to create tokens manually
