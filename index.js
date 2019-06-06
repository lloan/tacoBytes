require('dotenv').config();

const express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request');

const app = express();

// Starts server
app.listen(process.env.PORT, () => {
  console.log('Bot is listening on port ' + PORT);
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/', (req, res) => {
  let data = {
    form: {
      token: process.env.SLACK_AUTH_TOKEN,
      channel: '#bot',
      text: 'Hi! :wave: \n I\'m your new bot.',
    },
  };

  // post request to slack API
  request.post('https://slack.com/api/chat.postMessage', data, (error, response, body) => {
    res.json(); // sends message
  });
});