import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('8080'),
  CORS_ORIGIN: z.string().default('*'),
  // Blockchain
  RPC_URL: z.string().optional(),
  CHAIN_ID: z.coerce.number().optional(),
  PRIVATE_KEY: z.string().optional(),
  CONTRACT_ADDRESS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: Number(parsed.data.PORT),
  corsOrigin: parsed.data.CORS_ORIGIN,
  rpcUrl: parsed.data.RPC_URL,
  chainId: parsed.data.CHAIN_ID,
  privateKey: parsed.data.PRIVATE_KEY,
  contractAddress: parsed.data.CONTRACT_ADDRESS,
};
