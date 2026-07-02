import cors from 'cors';
import helmet from 'helmet';

// cors() below is wide open (origin: '*') - tighten this before any real deployment,
// same as the Socket.io CORS setting in server.ts.
export const corsMiddleware = cors();
export const helmetMiddleware = helmet();
