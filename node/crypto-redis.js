const redis = require('redis');

var HOST = process.env.HOST
if (HOST == null ){
  HOST  = 'localhost'
}

var REDIS_PORT = process.env.REDIS_PORT
if (REDIS_PORT == null ){
    REDIS_PORT = '30010'
}

const REDIS_CLIENT = redis.createClient({
    host: HOST,
    port: REDIS_PORT
});


module.exports = {
    REDIS_CLIENT:REDIS_CLIENT
    }