//const trace = require('./tracer');
const logger = require('./logger');
const LOGGER = logger.LOGGER
const redis = require('./crypto-redis');
const REDIS_CLIENT = redis.REDIS_CLIENT
const { Worker } = require('worker_threads')

var demoCoins = "BTC"
var COINS

if (process.env.COINS != null ){
  COINS = process.env.COINS.split(",");
  
} else{
  COINS  = demoCoins.split(",")
}

var value_collection_interval = 10000 // default of 10 seconds
if (process.env.VALUE_COLLECTION_INTERVAL != null){
  value_collection_interval = process.env.VALUE_COLLECTION_INTERVAL
}

var metric_sumbission_interval = 10000 // default of 10 seconds
if (process.env.METRIC_SUBMISSION_INTERVAL != null){
metric_sumbission_interval = process.env.METRIC_SUBMISSION_INTERVAL
}


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
    await new Promise(resolve => setTimeout(resolve, metric_sumbission_interval));
    runSendMetric(coin).catch(err => LOGGER.info(err))
    
  }

for (let item of COINS) {
  runGetPrice(item).catch(err => LOGGER.info(err))
  runSendMetric(item).catch(err => LOGGER.info(err))
  
}

   
LOGGER.info('Started Background processes');


