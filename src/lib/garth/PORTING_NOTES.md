# Garth TypeScript Port - Porting Notes

## What Has Been Ported

### ✅ Core Infrastructure (100% Complete)

1. **Authentication System** - `src/auth_tokens.ts`, `src/sso.ts`
   - OAuth1Token and OAuth2Token classes with expiration checks
   - Complete OAuth1/OAuth2 authentication flow
   - MFA (Multi-Factor Authentication) support
   - Token exchange and refresh mechanisms
   - Resume login functionality for MFA workflows
   - OAuth consumer credentials fetching from S3

2. **HTTP Client** - `src/http.ts`
   - Full-featured Client class with session management
   - Automatic retry logic with exponential backoff
   - OAuth2 token auto-refresh
   - API request methods (get, post, put, delete)
   - Connect API wrapper (`connectapi()`)
   - File upload/download support
   - Token serialization (dump/load to files, dumps/loads to base64)
   - Proxy and SSL configuration support

3. **Exception Handling** - `src/exc.ts`
   - GarthException base class
   - GarthHTTPError for HTTP-related errors

4. **Utilities** - `src/utils.ts`
   - camelToSnake and camelToSnakeDict for case conversion
   - formatEndDate for date normalization
   - dateRange generator for date iteration
   - asDict for object serialization
   - getLocalizedDatetime for timezone handling

5. **Base Classes**
   - `src/data/_base.ts` - Data base class with parallel fetching
   - `src/stats/_base.ts` - Stats base class with pagination

6. **Project Configuration**
   - `package.json` - Dependencies and build scripts
   - `tsconfig.json` - TypeScript compiler configuration
   - `.gitignore` - Git ignore patterns
   - `README.md` - Comprehensive documentation
   - `src/index.ts` - Main entry point with exports

## What Remains To Be Ported

### Data Models (to be extended from `Data` base class)

All in `src/garth/data/` in Python source:

1. **Sleep Data** - `data/sleep.py`
   - `SleepData` class with detailed sleep metrics
   - Sleep stages, scores, movement tracking
   - Complex nested structures (DailySleepDTO, SleepScores, SleepMovement)

2. **Weight Data** - `data/weight.py`
   - `WeightData` class with body composition
   - BMI, body fat, muscle mass, bone mass
   - Multiple data sources (scale, manual entry)

3. **HRV Data** - `data/hrv.py`
   - `HRVData` class with heart rate variability
   - HRV readings and summary
   - Time-based HRV measurements

4. **Body Battery** - `data/body_battery/`
   - `daily_stress.py` - DailyBodyBatteryStress
   - `events.py` - BodyBatteryData
   - `readings.py` - BodyBatteryReading, StressReading
   - Complex computed properties for min/max/change

### Stats Models (to be extended from `Stats` base class)

All in `src/garth/stats/` in Python source:

1. **Stress Stats** - `stats/stress.py`
   - `DailyStress` - Daily stress levels and durations
   - `WeeklyStress` - Weekly stress aggregation
   - Path: `/usersummary-service/stats/stress/daily/{start}/{end}`

2. **Steps Stats** - `stats/steps.py`
   - `DailySteps` - Daily step count and distance
   - `WeeklySteps` - Weekly step aggregation
   - Path: `/usersummary-service/stats/steps/daily/{start}/{end}`

3. **Sleep Stats** - `stats/sleep.py`
   - `DailySleep` - Daily sleep quality scores
   - Path: `/usersummary-service/stats/sleep/daily/{start}/{end}`

4. **HRV Stats** - `stats/hrv.py`
   - `DailyHRV` - Daily HRV with baseline and status
   - Custom list() implementation with different pagination
   - Path: `/hrv-service/hrv/daily/{start}/{end}`

5. **Hydration** - `stats/hydration.py`
   - `DailyHydration` - Daily water intake tracking
   - Path: `/usersummary-service/stats/hydration/daily/{start}/{end}`

6. **Intensity Minutes** - `stats/intensity_minutes.py`
   - `DailyIntensityMinutes` - Daily active minutes
   - `WeeklyIntensityMinutes` - Weekly aggregation
   - Path: `/usersummary-service/stats/metrics/daily/{start}/{end}`

### User Models

All in `src/garth/users/` in Python source:

1. **User Profile** - `users/profile.py`
   - `UserProfile` - Complete user profile data
   - Identity, preferences, roles, social info
   - Path: `/userprofile-service/socialProfile`

2. **User Settings** - `users/settings.py`
   - `UserSettings` - User configuration
   - `UserData` - Biometrics and training data
   - Various enums (PowerFormat, HeartRateFormat, etc.)
   - Paths: Various settings endpoints

### CLI (Optional)

From `src/garth/cli.py`:
- Command-line interface for login
- Interactive MFA handling
- Token storage management

## How To Continue Porting

### Step-by-Step Guide

#### 1. Porting a Stats Model

Example: DailySteps

```typescript
// src/stats/steps.ts
import { Stats } from './_base.js';

export class DailySteps extends Stats {
  static _path = '/usersummary-service/stats/steps/daily/{start}/{end}';
  static _page_size = 28; // Days per page

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

export class WeeklySteps extends Stats {
  static _path = '/usersummary-service/stats/steps/weekly/{start}/{end}';
  static _page_size = 12; // Weeks per page

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
```

#### 2. Porting a Data Model

Example: WeightData

```typescript
// src/data/weight.ts
import { Data } from './_base.js';
import { Client, client as defaultClient } from '../http.js';
import { camelToSnakeDict } from '../utils.js';

export class WeightData extends Data {
  static async get(
    day: Date | string,
    options: { client?: Client } = {}
  ): Promise<WeightData[] | null> {
    const client = options.client || defaultClient;
    const dateStr = typeof day === 'string' ? day : day.toISOString().split('T')[0];

    const data = await client.connectapi(
      `/weight-service/weight/dateRange?startDate=${dateStr}&endDate=${dateStr}`
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const converted = data.map(item => camelToSnakeDict(item));
    return converted.map(item => new WeightData(item));
  }

  sample_pk: number;
  calendar_date: Date;
  weight: number; // in grams
  bmi: number;
  body_fat: number | null;
  body_water: number | null;
  bone_mass: number | null;
  muscle_mass: number | null;
  source_type: string;

  constructor(data: any) {
    this.sample_pk = data.sample_pk;
    this.calendar_date = new Date(data.calendar_date);
    this.weight = data.weight;
    this.bmi = data.bmi;
    this.body_fat = data.body_fat ?? null;
    this.body_water = data.body_water ?? null;
    this.bone_mass = data.bone_mass ?? null;
    this.muscle_mass = data.muscle_mass ?? null;
    this.source_type = data.source_type;
  }
}
```

#### 3. Adding to Exports

After creating a model, add it to `src/index.ts`:

```typescript
// Add to index.ts
export { DailySteps, WeeklySteps } from './stats/steps.js';
export { WeightData } from './data/weight.js';
```

### Key Patterns to Follow

1. **Stats Models**:
   - Extend `Stats` base class
   - Set `static _path` with API endpoint template
   - Set `static _page_size` (28 for daily, 12 for weekly typically)
   - Implement constructor to map snake_case data to properties
   - Use `list()` method from base class (already implemented)

2. **Data Models**:
   - Extend `Data` base class
   - Implement `static async get()` method
   - Return `null` for no data, single instance or array
   - Use `list()` method from base class (already implemented)
   - Convert camelCase API responses to snake_case

3. **Type Safety**:
   - Use proper TypeScript types (number | null, string, Date, etc.)
   - Handle optional fields with `??` operator
   - Use type guards when checking API responses

4. **Error Handling**:
   - Let HTTP errors bubble up (they're caught by Client)
   - Return `null` for missing data (not errors)
   - Validate response structure before parsing

## Python to TypeScript Translation Guide

### Common Patterns

| Python | TypeScript |
|--------|-----------|
| `@dataclass` | `class` with constructor |
| `field: str \| None = None` | `field: string \| null = null` |
| `@property` | `get propertyName()` |
| `@classmethod` | `static async methodName()` |
| `def method(self, ...)` | `async method(...)` |
| `list[Self]` | `T[]` with generics |
| `date.fromisoformat()` | `new Date()` |
| `time.time()` | `Date.now() / 1000` |
| `ThreadPoolExecutor` | `Promise.all()` |
| `yield` | `yield` (same in TS) |

### Type Mappings

| Python Type | TypeScript Type |
|-------------|----------------|
| `str` | `string` |
| `int` | `number` |
| `float` | `number` |
| `bool` | `boolean` |
| `dict` | `Record<string, any>` or interface |
| `list` | `Array<T>` or `T[]` |
| `date` | `Date` |
| `datetime` | `Date` |
| `None` | `null` |
| `str \| None` | `string \| null` |

## Testing Your Port

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Test Authentication**:
   ```typescript
   import { client } from './dist/index.js';

   const [oauth1, oauth2] = await client.login('email', 'password');
   console.log('Logged in successfully!');
   ```

4. **Test a Model** (after porting):
   ```typescript
   import { DailySteps } from './dist/stats/steps.js';
   import { client } from './dist/index.js';

   // Load saved tokens
   client.load('~/.garth');

   // Fetch data
   const steps = await DailySteps.list(new Date(), 7, { client });
   console.log(steps);
   ```

## Reference Python Source

All Python source is in `src/garth/` directory:
- Core: `http.py`, `sso.py`, `auth_tokens.py`, `utils.py`, `exc.py`
- Data: `data/*.py`
- Stats: `stats/*.py`
- Users: `users/*.py`
- CLI: `cli.py`

Read the Python source carefully to understand:
- API endpoint paths
- Request parameters
- Response structure
- Data transformations
- Computed properties

## Notes on Implementation

### Critical Differences to Maintain

1. **OAuth Flow**: Must be identical to Python version
2. **API Paths**: Must match exactly (including query parameters)
3. **camelCase ↔ snake_case**: API returns camelCase, convert to snake_case
4. **Date Handling**: API uses ISO date strings, we use Date objects
5. **Pagination**: Stats models use recursive pagination when period > page_size

### Performance Considerations

1. **Parallel Fetching**: Data.list() uses Promise.all() for parallel requests
2. **Controlled Concurrency**: Limit concurrent requests (default: 10)
3. **Token Refresh**: Only refresh OAuth2 when expired
4. **Caching**: Consider caching user_profile (already implemented)

## Questions or Issues?

Refer to:
1. Original Python source in `src/garth/`
2. Python README for API behavior
3. TypeScript README for usage examples
4. Base class implementations for patterns

Happy porting! 🚀
