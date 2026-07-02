import morgan from 'morgan';

// 'dev' format: colored, concise, good for local development. Swap to
// 'combined' if this ever needs to feed a real log aggregator.
export const morganMiddleware = morgan('dev');
