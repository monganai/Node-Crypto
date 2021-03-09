const https = require('https')
const logger = require('./logger');

const LOGGER = logger.LOGGER


crypto = 'BTC'
base = 'EUR'

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
      console.dir(jsonStr, {depth: null, colors: true})

      LOGGER.info("Current_price: " + jsonStr.ticker.price)
      LOGGER.info("last hour change: "+  jsonStr.ticker.change)
      LOGGER.info("timestamp: "+  jsonStr.timestamp)
  
    });
  }



  https.request(options, callback).end();
