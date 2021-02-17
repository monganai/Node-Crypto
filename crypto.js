//const trace = require('./tracer');
const logger = require('./logger');
const LOGGER = logger.LOGGER
const redis = require('./crypto-redis');
const REDIS_CLIENT = redis.REDIS_CLIENT

const COINS  = ['BTC', 'ETH']; // env

const value_collection_interval = 5000 // env
const sumbission_interval = 10000 // env

const { Worker } = require('worker_threads')


function runGetPriceService(workerData, coin) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./crypto-getPrice.js', { workerData: {thisCoin: coin} });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    })
  })
}


function runSendMetricService(workerData, coin) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./crypto-submitMetrics.js', { workerData: {thisCoin: coin} });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      })
    })
  }


async function runGetPrice(coin) {
  const result = await runGetPriceService(coin, coin)
  await new Promise(resolve => setTimeout(resolve, value_collection_interval));
  runGetPrice(coin).catch(err => LOGGER.info(err))

}

async function runSendMetric(coin) {
    const result = await runSendMetricService(coin, coin)
    await new Promise(resolve => setTimeout(resolve, sumbission_interval));
    runSendMetric(coin).catch(err => LOGGER.info(err))
    
  }

for (let item of COINS) {
  runGetPrice(item).catch(err => LOGGER.info(err))
  runSendMetric(item).catch(err => LOGGER.info(err))
  
}

   
LOGGER.info('Started Background processes');


