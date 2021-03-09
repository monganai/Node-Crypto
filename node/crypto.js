
//const tracer = require('./tracer')
//const TRACER = tracer.TRACER
const logger = require('./logger');
const LOGGER = logger.LOGGER
const pg = require('./pg_init.js');
const PGCLIENT = pg.PGCLIENT
const { Worker } = require('worker_threads')
const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var demoCoins = "BTC,ETH"
var COINS
var currency

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

var value_collection_interval = 10000 // default of 10 seconds
if (process.env.VALUE_COLLECTION_INTERVAL != null){
  value_collection_interval = process.env.VALUE_COLLECTION_INTERVAL
}

var metric_sumbission_interval = 10000 // default of 10 seconds
if (process.env.METRIC_SUBMISSION_INTERVAL != null){
metric_sumbission_interval = process.env.METRIC_SUBMISSION_INTERVAL
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

async function runGetPrice(coin,currency) {
  const result = await runGetPriceService(coin, coin, currency, currency)
  await new Promise(resolve => setTimeout(resolve, value_collection_interval));
  runGetPrice(coin,currency).catch(err => LOGGER.info(err))

}

async function runSendMetric(coin, currency) {
    const result = await runSendMetricService(coin, coin, currency, currency)
    await new Promise(resolve => setTimeout(resolve, metric_sumbission_interval));
    runSendMetric(coin,currency).catch(err => LOGGER.info(err))
    
  }


LOGGER.info('Initilizing Database')

PGCLIENT.connect();

// creation of crypto tables:
for (let item of COINS) {

  PGCLIENT.query('CREATE TABLE '+item+' (curr_value varchar,currency varchar,timestamp timestamp)', (err, res) => {
    if (err) {
       LOGGER.info(err);
      return;
             }
      LOGGER.info(res);
            }); 
          }

LOGGER.info('Starting Background processes');

for (let item of COINS) {
  runGetPrice(item,currency).catch(err => LOGGER.info(err))
  runSendMetric(item,currency).catch(err => LOGGER.info(err))
  
}

// express server for webooks
router.post('/',(request,response) => {
    LOGGER.info(request.body);
    LOGGER.info('Crypto metric to watch: ' + request.body.crypto_metric)
});

app.use("/", router);

app.listen(8888,() => {
    LOGGER.info("Started listening on PORT 8888");
  })


