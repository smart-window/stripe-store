import pino from 'pino'
import { logflarePinoVercel } from 'pino-logflare'

const logger = pino({
    browser: {
        transmit: {
            level: "info"
        }
    },
    level: "debug",
    base: {
        env: process.env.NODE_ENV
    },
});

export default logger