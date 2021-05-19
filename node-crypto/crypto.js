const logger = require('./logger');
const LOGGER = logger.LOGGER
const pg = require('./pg_init.js');
const PGCLIENT = pg.PGCLIENT
const { Worker } = require('worker_threads')

var demoCoins = "BTC,ETH"
var COINS
var currency
var SQL_interval // posgreql syntax required
var stats_generation_interval // must match


if (process.env.CURRENCY != null){
  currency = process.env.CURRENCY
} else{
  currency = "EUR"
}

if (process.env.COINS != null ){
  COINS = process.env.COINS.split(",");
  
} else{
  COINS  = demoCoins.split(",")
}

if (process.env.STATS_INTERVAL != null ){
  stats_generation_interval = process.env.STATS_INTERVAL * 1000
  SQL_interval = parseFloat(stats_generation_interval)/1000/60/60 + ' HOURS'
  
} else{
  stats_generation_interval = 86400 * 1000
  SQL_interval = parseFloat(stats_generation_interval)/1000/60/60 + ' HOURS'

  
}

var value_collection_interval = 10000 // default of 10 seconds
if (process.env.VALUE_COLLECTION_INTERVAL != null){
  value_collection_interval = process.env.VALUE_COLLECTION_INTERVAL * 1000
}

var metric_sumbission_interval = 10000 // default of 10 seconds
if (process.env.METRIC_SUBMISSION_INTERVAL != null){
metric_sumbission_interval = process.env.METRIC_SUBMISSION_INTERVAL * 1000
}


function runGetPriceService(workerData, coin, currency) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./crypto-getPrice.js', { workerData: {thisCoin: coin, thisCurrency: currency} });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    })
  })
}

async function runGetPrice(coin,currency) {
  const result = await runGetPriceService(coin, coin, currency, currency)
  await new Promise(resolve => setTimeout(resolve, value_collection_interval));
  runGetPrice(coin,currency).catch(err => LOGGER.info(err))

}

function runSendMetricService(workerData, coin, currency) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./crypto-submitMetrics.js', { workerData: {thisCoin: coin, thisCurrency: currency} });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      })
    })
  }


async function runSendMetric(coin, currency) {
    const result = await runSendMetricService(coin, coin, currency, currency)
    await new Promise(resolve => setTimeout(resolve, metric_sumbission_interval));
    runSendMetric(coin,currency).catch(err => LOGGER.info(err))
    
  }


  function runCalculateStatsService(workerData, coin, currency, SQL_interval) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./generate_stats.js', { workerData: {thisCoin: coin, thisInterval: SQL_interval, thisCurrency: currency} });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      })
    })
  }



  async function runCalculateStats(coin, currency, SQL_interval) {
    const result = await runCalculateStatsService(coin, coin, currency, SQL_interval)
    await new Promise(resolve => setTimeout(resolve, stats_generation_interval));
    runCalculateStats(coin, currency, SQL_interval).catch(err => LOGGER.info(err))
    
  }


LOGGER.info('Initilizing Database')

PGCLIENT.connect();

// creation of crypto tables:
for (let coin of COINS) {

  PGCLIENT.query('CREATE TABLE '+coin+' (curr_value varchar,currency varchar,timestamp timestamp)', (err, res) => {
    if (err) {
       LOGGER.info(err);
      return;
             }
      LOGGER.info(res);
            }); 


tableName = coin+'_'+currency+'_'+SQL_interval.replace(/ /g, '');


PGCLIENT.query('CREATE TABLE '+tableName+' (average varchar,maximum varchar, minimum varchar, timestamp timestamp)', (err, res) => {
  if (err) {
     LOGGER.info(err);
    return;
           }
    LOGGER.info(res);
          }); 


          }
          
LOGGER.info('Starting Background processes');

for (let coin of COINS) {
  runGetPrice(coin,currency).catch(err => LOGGER.info(err))
  runSendMetric(coin,currency).catch(err => LOGGER.info(err))
  runCalculateStats(coin, currency, SQL_interval).catch(err => LOGGER.info(err))
  
}


