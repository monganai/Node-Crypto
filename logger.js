const { createLogger, format, transports } = require('winston');

const LOGGER = createLogger({
    level: 'info',
    exitOnError: false,
    format: format.json(),
    transports: [
    new transports.Console(),
    new transports.File({ filename: `logs/test.log` }),
    
    ],
    });

    module.exports = {
        LOGGER:LOGGER
        }