import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('8080'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('guardian_ai'),
  DB_USER: z.string().default('guardian'),
  DB_PASSWORD: z.string().default('guardian_secret'),
  DB_SSL: z.string().default('false'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CACHE_TTL_SECONDS: z.string().default('300'),

  // API Keys
  VIRUSTOTAL_API_KEY: z.string().optional(),
  GOOGLE_SAFE_BROWSING_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // IP Geolocation
  IPINFO_TOKEN: z.string().optional(),

  // API Security
  API_KEY: z.string().optional(),
  API_KEY_HEADER: z.string().default('x-api-key'),

  // Blockchain
  RPC_URL: z.string().optional(),
  CHAIN_ID: z.coerce.number().optional(),
  PRIVATE_KEY: z.string().optional(),
  CONTRACT_ADDRESS: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  SCAN_RATE_LIMIT_MAX: z.string().default('20'),

  // Feature flags
  ENABLE_BLOCKCHAIN: z.string().default('false'),
  ENABLE_LLM: z.string().default('true'),
  ENABLE_THREAT_INTEL: z.string().default('true'),
  ENABLE_ML: z.string().default('true'),

  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const d = parsed.data;

export const config = {
  nodeEnv: d.NODE_ENV,
  port: Number(d.PORT),
  corsOrigin: d.CORS_ORIGIN,
  logLevel: d.LOG_LEVEL,

  db: {
    url: d.DATABASE_URL,
    host: d.DB_HOST,
    port: Number(d.DB_PORT),
    name: d.DB_NAME,
    user: d.DB_USER,
    password: d.DB_PASSWORD,
    ssl: d.DB_SSL === 'true',
  },

  redis: {
    url: d.REDIS_URL,
    ttl: Number(d.CACHE_TTL_SECONDS),
  },

  api: {
    virusTotalKey: d.VIRUSTOTAL_API_KEY,
    safeBrowsingKey: d.GOOGLE_SAFE_BROWSING_API_KEY,
    openAiKey: d.OPENAI_API_KEY,
    openAiModel: d.OPENAI_MODEL,
    ipInfoToken: d.IPINFO_TOKEN,
    apiKey: d.API_KEY,
    apiKeyHeader: d.API_KEY_HEADER,
  },

  rateLimit: {
    windowMs: Number(d.RATE_LIMIT_WINDOW_MS),
    max: Number(d.RATE_LIMIT_MAX),
    scanMax: Number(d.SCAN_RATE_LIMIT_MAX),
  },

  features: {
    blockchain: d.ENABLE_BLOCKCHAIN === 'true',
    llm: d.ENABLE_LLM === 'true',
    threatIntel: d.ENABLE_THREAT_INTEL === 'true',
    ml: d.ENABLE_ML === 'true',
  },

  blockchain: {
    rpcUrl: d.RPC_URL,
    chainId: d.CHAIN_ID,
    privateKey: d.PRIVATE_KEY,
    contractAddress: d.CONTRACT_ADDRESS,
  },
} as const;
