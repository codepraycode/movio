import morgan from 'morgan';
import { httpLogStream } from '../utils/logger';

// Piped through the winston logger's `http` level so HTTP access logs share
// the same colorized, timestamped format as the rest of the app's logs,
// instead of morgan's own separate coloring.
export const morganMiddleware = morgan(':method :url :status - :response-time ms', {
    stream: httpLogStream,
});
