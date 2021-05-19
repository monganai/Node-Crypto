const pg = require('./pg_init.js');
const PGCLIENT = pg.PGCLIENT
const logger = require('./logger');
const LOGGER = logger.LOGGER
const { workerData, parentPort } = require('worker_threads')

var currency = workerData.thisCurrency
var coin = workerData.thisCoin
var interval = workerData.thisInterval
var tableName = coin+'_'+currency+'_'+interval.replace(/ /g, '');
 
PGCLIENT.connect();


function generateStats(coin, currency, interval){
     values = []; 
     var sum = 0;
     PGCLIENT.query("SELECT curr_value from "+coin+" WHERE currency = '"+currency.toUpperCase()+"' AND timestamp BETWEEN NOW() - INTERVAL '"+interval.toUpperCase()+"' AND NOW();", (err, res) => {
          if (err) {
          LOGGER.info('generate_stats: \n' + err)
                   return;
               }
                   for (let item in res.rows){
                        values.push(parseFloat(res.rows[item].curr_value))
                        sum = sum +  parseFloat(res.rows[item].curr_value)
                   }
                   minimum = Math.min.apply(Math, values)
                   maximum = Math.max.apply(Math, values)
                   publishStats(maximum,minimum,sum/values.length)
                         }); 

}

function publishStats(max, min, average){

            const time = new Date().toISOString()
            PGCLIENT.query('INSERT INTO '+tableName+' (average, minimum, maximum, timestamp) VALUES ($1, $2, $3, $4)', [average, min, max, time], (err, res) => {
            if (err) {
                LOGGER.info('generate_stats -> publish_stats: \n' + err)
               PGCLIENT.end()
              return;
                     }
              //LOGGER.info(res);
              PGCLIENT.end()
                    }); 

}

generateStats(coin,currency,interval)

parentPort.postMessage({ metricComplete: workerData })
