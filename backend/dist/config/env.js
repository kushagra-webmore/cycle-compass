import { config } from 'dotenv';
import { z } from 'zod';
config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().default('4000'),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    SUPABASE_ANON_KEY: z.string(),
    SUPABASE_JWT_SECRET: z.string(),
    GEMINI_API_KEY: z.string(),
    PAIRING_TOKEN_EXPIRY_HOURS: z.string().default('24'),
    CLIENT_APP_URL: z.string().url(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
export const env = {
    ...parsed.data,
    PORT: Number(parsed.data.PORT),
    PAIRING_TOKEN_EXPIRY_HOURS: Number(parsed.data.PAIRING_TOKEN_EXPIRY_HOURS),
};
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';
//# sourceMappingURL=env.js.map