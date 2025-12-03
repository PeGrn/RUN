# Garth - TypeScript Port

A TypeScript port of the Garth Python library for Garmin SSO authentication and Garmin Connect API access.

## Overview

This is a direct port of the [Garth Python library](https://github.com/matin/garth) to TypeScript, maintaining the exact same functionality and behavior. It provides OAuth1/OAuth2 authentication for Garmin services and a convenient HTTP client for accessing the Garmin Connect API.

## Installation

```bash
npm install
npm run build
```

## Project Structure

```
typescript-port/
├── src/
│   ├── index.ts              # Main entry point with exports
│   ├── auth_tokens.ts        # OAuth1Token & OAuth2Token classes
│   ├── exc.ts                # Custom exceptions
│   ├── http.ts               # HTTP Client class
│   ├── sso.ts                # OAuth authentication flows
│   ├── utils.ts              # Utility functions
│   ├── data/
│   │   └── _base.ts          # Base class for data models
│   └── stats/
│       └── _base.ts          # Base class for stats models
├── package.json
├── tsconfig.json
└── README.md
```

## Core Functionality Ported

### ✅ Completed
- **OAuth Authentication** (`auth_tokens.ts`, `sso.ts`)
  - OAuth1Token and OAuth2Token classes
  - Login flow with email/password
  - MFA (Multi-Factor Authentication) support
  - Token exchange and refresh
  - Resume login after MFA

- **HTTP Client** (`http.ts`)
  - Session management with retry logic
  - Automatic OAuth2 token refresh
  - API request handling
  - Token serialization (dump/load, dumps/loads)
  - File upload/download support

- **Utilities** (`utils.ts`)
  - camelCase ↔ snake_case conversion
  - Date formatting and range generation
  - Object serialization

- **Base Classes**
  - `Data` base class for data models with parallel fetching
  - `Stats` base class for stats models with pagination

### 📝 To Be Implemented
You can extend this port by adding specific data and stats models:

**Data Models** (extend `Data` base class):
- Sleep data (`data/sleep.ts`)
- Weight data (`data/weight.ts`)
- HRV data (`data/hrv.ts`)
- Body battery data (`data/body_battery/`)

**Stats Models** (extend `Stats` base class):
- Daily/Weekly stress (`stats/stress.ts`)
- Daily/Weekly steps (`stats/steps.ts`)
- Daily sleep stats (`stats/sleep.ts`)
- Daily HRV stats (`stats/hrv.ts`)
- Hydration (`stats/hydration.ts`)
- Intensity minutes (`stats/intensity_minutes.ts`)

**User Models**:
- User profile (`users/profile.ts`)
- User settings (`users/settings.ts`)

**CLI** (optional):
- Command-line interface (`cli.ts`)

## Usage

### Basic Authentication

```typescript
import { client, login } from './src/index.js';

// Login with email and password
const [oauth1, oauth2] = await client.login('your-email@example.com', 'your-password');

// Save tokens for later use
client.dump('~/.garth');
```

### With MFA Support

```typescript
// Option 1: Prompt for MFA code
const [oauth1, oauth2] = await client.login(
  'your-email@example.com',
  'your-password',
  undefined,
  () => {
    // Your MFA prompt logic here
    return '123456'; // Return the MFA code
  }
);

// Option 2: Return on MFA and resume later
const result = await client.login(
  'your-email@example.com',
  'your-password',
  undefined,
  null,
  true // returnOnMfa
);

if (Array.isArray(result) && result[0] === 'needs_mfa') {
  const mfaCode = '123456'; // Get MFA code from user
  const [oauth1, oauth2] = await client.resume_login(result[1], mfaCode);
}
```

### Loading Saved Tokens

```typescript
import { client } from './src/index.js';

// Load tokens from directory
client.load('~/.garth');

// Or load from base64 string
const tokenString = client.dumps();
client.loads(tokenString);
```

### Making API Requests

```typescript
// Get user profile
const profile = await client.connectapi('/userprofile-service/socialProfile');
console.log(profile);

// Get username
console.log(client.username);

// Download data
const data = await client.download('/some/api/path');

// Upload file
import * as fs from 'fs';
const fileStream = fs.createReadStream('./activity.fit');
const result = await client.upload(fileStream);
```

### Using Base Classes

#### Extending Stats Class

```typescript
import { Stats } from './src/stats/_base.js';

class DailySteps extends Stats {
  static _path = '/usersummary-service/stats/steps/daily/{start}/{end}';
  static _page_size = 28;

  total_steps: number | null;
  total_distance: number | null;
  step_goal: number;

  constructor(calendar_date: Date, data: any) {
    super(calendar_date);
    this.total_steps = data.total_steps ?? null;
    this.total_distance = data.total_distance ?? null;
    this.step_goal = data.step_goal;
  }
}

// Usage
const steps = await DailySteps.list(new Date(), 7, { client });
```

#### Extending Data Class

```typescript
import { Data } from './src/data/_base.js';
import { Client } from './src/http.js';

class WeightData extends Data {
  static async get(day: Date | string, options: { client?: Client } = {}) {
    const client = options.client || defaultClient;
    const dateStr = typeof day === 'string' ? day : day.toISOString().split('T')[0];

    const data = await client.connectapi(
      `/weight-service/weight/dateRange?startDate=${dateStr}&endDate=${dateStr}`
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data.map(item => new WeightData(item));
  }

  weight: number;
  bmi: number;

  constructor(data: any) {
    this.weight = data.weight;
    this.bmi = data.bmi;
  }
}

// Usage
const weights = await WeightData.list(new Date(), 7, { client });
```

## Key Differences from Python Version

1. **Async/Await**: All network operations are async in TypeScript
2. **Promise.all**: Used instead of `ThreadPoolExecutor` for parallel requests
3. **Axios**: Replaces Python's `requests` library
4. **oauth-1.0a**: Replaces Python's `requests-oauthlib`
5. **Classes**: Used instead of Pydantic dataclasses
6. **Type Annotations**: TypeScript's built-in type system replaces Python's type hints

## Configuration

The HTTP client supports the following configuration options:

```typescript
client.configure({
  domain: 'garmin.com',        // Garmin domain
  timeout: 10000,              // Request timeout in ms (default: 10000)
  retries: 3,                  // Number of retries (default: 3)
  status_forcelist: [408, 429, 500, 502, 503, 504],
  backoff_factor: 0.5,         // Backoff between retries (default: 0.5)
  oauth1_token: oauth1Token,   // Set OAuth1 token
  oauth2_token: oauth2Token,   // Set OAuth2 token
});
```

## Dependencies

- **axios**: HTTP client
- **axios-retry**: Automatic retry with exponential backoff
- **oauth-1.0a**: OAuth 1.0a signature generation
- **crypto-js**: Cryptographic functions
- **form-data**: Multipart form data for file uploads

## Building

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Output will be in dist/ directory
```

## Development

```bash
# Clean build artifacts
npm run clean

# Run build
npm run build
```

## Authentication Flow

1. **Initial Login**: Email/password → OAuth1 token
2. **Token Exchange**: OAuth1 token → OAuth2 token
3. **API Requests**: OAuth2 token (auto-refreshed when expired)
4. **Token Refresh**: OAuth1 token → New OAuth2 token (when OAuth2 expires)

## Error Handling

The library throws two custom exceptions:

- `GarthException`: Base exception for all Garth errors
- `GarthHTTPError`: HTTP-related errors (extends GarthException)

```typescript
import { GarthHTTPError, GarthException } from './src/exc.js';

try {
  await client.login('email', 'password');
} catch (error) {
  if (error instanceof GarthHTTPError) {
    console.error('HTTP Error:', error.message);
  } else if (error instanceof GarthException) {
    console.error('Garth Error:', error.message);
  }
}
```

## Contributing

To add more data/stats models:

1. Create a new file in `src/data/` or `src/stats/`
2. Extend the appropriate base class (`Data` or `Stats`)
3. Implement required methods and properties
4. Follow the patterns in the Python source
5. Export from `src/index.ts`

## License

MIT License - Same as the original Garth Python library

## Credits

This is a TypeScript port of [Garth](https://github.com/matin/garth) by Matin Tamizi.

Original Python library: https://github.com/matin/garth
