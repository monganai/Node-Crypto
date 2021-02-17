var StatsD = require('hot-shots');

var HOST = process.env.HOST
if (HOST == null ){
  HOST  = 'localhost'
}

const dogStatsd = new StatsD({
    port: 8125,
    host: HOST,

});

module.exports = {
    dogStatsd:dogStatsd
    }