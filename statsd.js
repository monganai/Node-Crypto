var StatsD = require('hot-shots');
var DD_AGENT_HOST = '192.168.0.230' //env

const dogStatsd = new StatsD({
    port: 8125,
    host: DD_AGENT_HOST,

});

module.exports = {
    dogStatsd:dogStatsd
    }