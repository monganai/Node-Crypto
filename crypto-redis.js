const redis = require('redis');
const DD_AGENT_HOST = '192.168.0.230' // env
const REDIS_PORT = '30010'  // env

const REDIS_CLIENT = redis.createClient({
    host: DD_AGENT_HOST,
    port: REDIS_PORT
});


module.exports = {
    REDIS_CLIENT:REDIS_CLIENT
    }