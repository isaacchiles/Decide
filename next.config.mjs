import { withOutstatic } from 'outstatic/next-plugin';

// Fail the production build if critical env vars are missing.
// Catches missing config before it reaches users.
if (process.env.NODE_ENV === 'production') {
  const required = ['NEXT_PUBLIC_APP_URL', 'ANTHROPIC_API_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

const nextConfig = {};

export default withOutstatic(nextConfig);
