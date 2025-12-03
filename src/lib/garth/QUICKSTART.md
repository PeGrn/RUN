# Quick Start Guide

## Installation

```bash
cd typescript-port
npm install
npm run build
```

## Basic Usage Example

Create a file `example.js`:

```javascript
import { client } from './dist/index.js';

async function main() {
  try {
    // Login
    console.log('Logging in...');
    const [oauth1, oauth2] = await client.login(
      'your-email@example.com',
      'your-password'
    );

    console.log('Login successful!');

    // Save tokens for future use
    client.dump('~/.garth');

    // Get user profile
    const profile = await client.user_profile;
    console.log('Username:', profile.userName);
    console.log('Display Name:', profile.displayName);

    // Make an API request
    const data = await client.connectapi('/userprofile-service/socialProfile');
    console.log('Profile data:', data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

Run it:
```bash
node example.js
```

## With MFA

```javascript
import { client } from './dist/index.js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptMFA() {
  return new Promise((resolve) => {
    rl.question('Enter MFA code: ', (answer) => {
      resolve(answer);
      rl.close();
    });
  });
}

async function main() {
  try {
    const [oauth1, oauth2] = await client.login(
      'your-email@example.com',
      'your-password',
      undefined,
      promptMFA
    );

    console.log('Login successful!');
    client.dump('~/.garth');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Loading Saved Tokens

```javascript
import { client } from './dist/index.js';

async function main() {
  // Load previously saved tokens
  client.load('~/.garth');

  // Now you can make API requests
  const profile = await client.connectapi('/userprofile-service/socialProfile');
  console.log(profile);
}

main();
```

## Project Structure

```
typescript-port/
├── src/                    # TypeScript source files
│   ├── index.ts           # Main exports
│   ├── auth_tokens.ts     # OAuth token classes
│   ├── sso.ts             # Authentication flows
│   ├── http.ts            # HTTP client
│   ├── exc.ts             # Exceptions
│   ├── utils.ts           # Utilities
│   ├── data/
│   │   └── _base.ts       # Data base class
│   └── stats/
│       └── _base.ts       # Stats base class
├── dist/                   # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
├── README.md              # Full documentation
├── PORTING_NOTES.md       # Guide for porting remaining models
└── QUICKSTART.md          # This file
```

## Next Steps

1. **Read README.md** for complete API documentation
2. **Read PORTING_NOTES.md** if you want to add more data/stats models
3. **Save your tokens** to avoid logging in every time:
   ```javascript
   client.dump('~/.garth');  // Save
   client.load('~/.garth');  // Load later
   ```

## Common Issues

### "Cannot find module"
Make sure you've run `npm run build` first.

### "OAuth1 token is required"
You need to login first or load saved tokens.

### "Couldn't find CSRF token"
Check your email/password. The login page structure might have changed.

### TypeScript errors
The project uses TypeScript with strict mode. Make sure all types are correct.

## Getting Help

- Check [README.md](./README.md) for detailed documentation
- Check [PORTING_NOTES.md](./PORTING_NOTES.md) for implementation details
- Review the Python source in `../src/garth/` for reference
- Open an issue on the original Garth repository
