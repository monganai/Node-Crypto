//const trace = require('./tracer');
const logger = require('./logger');
const redis = require('./crypto-redis');
const LOGGER = logger.LOGGER
const REDIS_CLIENT = redis.REDIS_CLIENT
const { workerData, parentPort } = require('worker_threads')

var crypto = workerData.thisCoin

let price = require('crypto-price')

var base = 'EUR' // env

function getCryptoPrice(base, crypto) {
    price.getCryptoPrice(base, crypto).then(obj => {  
            REDIS_CLIENT.set(crypto, obj.price, (err, reply) => {
                if (err) throw err;
            LOGGER.info('Current price of ' + crypto + ' in ' + base + ' is ' + obj.price);
            REDIS_CLIENT.quit();
            });
        
    }).catch(err => {
        LOGGER.error(err)
         REDIS_CLIENT.quit();
    })
}

getCryptoPrice(base, crypto);

parentPort.postMessage({ hello: workerData })

