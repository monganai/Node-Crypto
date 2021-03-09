const logger = require('./logger');
const LOGGER = logger.LOGGER
const dsd = require('./statsd')
const dogStatsd = dsd.dogStatsd
const redis = require('./crypto-redis');
const REDIS_CLIENT = redis.REDIS_CLIENT

const { workerData, parentPort } = require('worker_threads')

var base = workerData.thisCurrency
var crypto = workerData.thisCoin

function submitDDData(crypto){

    REDIS_CLIENT.get(crypto, (err, reply) => {
        if (err){
            LOGGER.error(err);
            REDIS_CLIENT.quit();
            throw err;
             } 
             dogStatsd.histogram('crypto.' +crypto+'.price.'+base,reply);
             dogStatsd.gauge('crypto.price',reply, {'coin' : crypto, 'currency': base});
            LOGGER.info('Submitted metric for: ' + crypto + ' with a value of: ' + reply)
            REDIS_CLIENT.quit();
             
    })
}

submitDDData(crypto);

parentPort.postMessage({ metricComplete: workerData })