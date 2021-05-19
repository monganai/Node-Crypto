
const TRACER = require('dd-trace').init({
    service: 'discord-crypto',
    logInjection: true,
    version: '0.1',
    env: 'crypto',
    debug: false
});

const logger = require('./logger');
const LOGGER = logger.LOGGER
const webhook = require("webhook-discord")
const redis = require('./crypto-redis');
const REDIS_CLIENT = redis.REDIS_CLIENT
const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const Discord = require('discord.js');

var coins
var token
var discord_url
var demoCoins = "BTC,ETH"

if (process.env.COINS != null ){
    coins = process.env.COINS.split(",");
    
  } else{
    coins  = demoCoins.split(",")
  }

if (process.env.DISCORD_TOKEN != null){
    token = process.env.DISCORD_TOKEN
  } else{
    token = "n/a"
  }

if (process.env.DISCORD_URL != null){
    discord_url = process.env.DISCORD_URL
  } else{
    discord_url = "n/a"
  }


  if (process.env.CURRENCY != null){
    currency = process.env.CURRENCY
  } else{
    currency = "EUR"
  }

  // express server for webooks
router.post('/',(request,response) => {
    const Hook = new webhook.Webhook(discord_url)
    alert_tags = request.body.tags
    alert_tags_arr = alert_tags.split(',')
    alerting_tag = alert_tags_arr[0] // outputs 'coin:coin_name'
    alerting_coin_arr = alerting_tag.split(':')
    alerting_coin = alerting_coin_arr[1]
    LOGGER.info('Incoming Webhook recieved for ' + alerting_coin)
    REDIS_CLIENT.get(alerting_coin.toUpperCase(), (err, reply) => {
      if (err){
          LOGGER.error(err);
          REDIS_CLIENT.quit();
          throw err;
           } 
           const post_span = TRACER.scope().active()
           TRACER.trace('post_webhook', () => { 
            post_span.setTag('coin', alerting_coin)
           Hook.warn("Node Crypto " + alerting_coin.toUpperCase() , "Anomalous behavior has been detected on " + alerting_coin + "\n Its latest value in " + currency + " is: " + reply)
           LOGGER.info('Webhook submitted to Discord for ' + alerting_coin)
           })     
      
  })

});

app.use("/", router);

app.listen(8888,() => {
    LOGGER.info("Started listening on PORT 8888");
  })

  app.get('/', function (req, res) {
    res.send('Hello crypto!');
  });

// Discord Bot
const bot = new Discord.Client();
bot.login(token);
bot.on('ready', () => {
    LOGGER.info(`Logged in as ${bot.user.tag}!`);
  });

  bot.on('message', msg => {
    const recieve_message = TRACER.scope().active()
    TRACER.trace('recieve_message', () => { 

         var msg_string = msg.content.toUpperCase()
         if(coins.includes(msg_string)){
          REDIS_CLIENT.get(msg_string, (err, reply) => {
              if (err){
                  throw err;
                   } 
                   const post_message = TRACER.scope().active()
                   TRACER.trace('post_reply', () => { 
                   msg.reply( msg_string + ' price now: ' + reply);
                   })
           })
    }

}) // recieve message

  });
