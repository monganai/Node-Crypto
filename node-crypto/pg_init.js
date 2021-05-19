const { Client } = require('pg');

const PGCLIENT = new Client({
    user: 'postgresadmin',
    host: '192.168.0.230',
    database: 'postgresdb',
    password: 'admin123',
    port: 30015,
});

module.exports = {
    PGCLIENT:PGCLIENT
    }