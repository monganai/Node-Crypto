const logger = require('./logger');
const redis = require('./crypto-redis');
const LOGGER = logger.LOGGER
const https = require('https')
const REDIS_CLIENT = redis.REDIS_CLIENT
const pg = require('./pg_init.js');
const PGCLIENT = pg.PGCLIENT
const { workerData, parentPort } = require('worker_threads')

var crypto = workerData.thisCoin
var base = workerData.thisCurrency

const options = {
  hostname: 'api.cryptonator.com',
  port: 443,
  path: '/api/full/'+crypto+'-'+base,
  method: 'GET'
}

callback = function(response) {
  var str = '';
  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    const jsonStr = JSON.parse(str)
    getCryptoPrice(base, crypto, jsonStr);

  });
}

function getCryptoPrice(base, crypto, value) {
            REDIS_CLIENT.set(crypto, value.ticker.price, (err, reply) => {
                if (err) throw err;
            LOGGER.info('Current price of ' + crypto + ' in ' + base + ' is ' + value.ticker.price);
            REDIS_CLIENT.quit();
            PGCLIENT.connect();
            const time = new Date().toISOString()
            PGCLIENT.query('INSERT INTO '+crypto+' (curr_value, currency, timestamp) VALUES ($1, $2, $3)', [value.ticker.price,base,time], (err, res) => {
            if (err) {
               LOGGER.info(err);
               console.log(err)
              return;
                     }
              LOGGER.info(res);
               PGCLIENT.end();
                    }); 
            });
}

https.request(options, callback).end();

parentPort.postMessage({ hello: workerData })

