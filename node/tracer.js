const TRACER = require('dd-trace').init({
    service: 'crypto',
    logInjection: true,
    version: '0.1',
    debug: false
});



module.exports = {
TRACER:TRACER,
}