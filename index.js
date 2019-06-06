require('dotenv').config();

const express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    redis = require('redis');

const client = redis.createClient();
const app = express();

// Starts server
app.listen(process.env.PORT, () => {
  console.log('Bot is listening on port ' + process.env.PORT);
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

client.on('connect', function() {
  console.log('connected');
});

// leave in place to test if running
app.post('/', (req, res) => {
  let data = {
    form: {
      token: process.env.SLACK_AUTH_TOKEN,
      channel: '#bot',
      text: 'Hi! I\'m fully functional!',
    },
  };

  // post request to slack API
  request.post('https://slack.com/api/chat.postMessage', data, (error, response, body) => {
    res.json(); // sends message
  });
});

// events
app.post('/events', (req, res) => {
      console.log(req.body);

      // event verification
      if (req.body.challenge) {
        res.send(req.body.challenge);
        res.end(); // end connection
      }

      /**
       * App Mention (when tacoBytes is called)
       */
      if (req.body.event && req.body.event.type === 'app_mention') {
        /**
         * Prepare data to be sent via API to Slack
         * @type {{form: {token: *, link_names: boolean, thread_ts: *, channel: (string|string), text: string}}}
         */
        let data = {
          form: {
            token: process.env.SLACK_AUTH_TOKEN,
            link_names: true,
            thread_ts: req.body.event.event_ts,
            channel: req.body.event.channel,
            text: `Hi! <@${req.body.event.user}>!`, // setting default text
          },
        };

        // giving tacos - rough
        if (req.body.event.text && req.body.event.text.indexOf(':taco:') !== -1) {
          const tacos = req.body.event.text.match(/:taco:/g).length; // number of tacos found
          let warnings = [];
          let awarded = [];
          let users = req.body.event.text.match(/<(.*?)>/g).slice(1); // find all users mentioned in text

          if (users.length !== 0) { // if at least 2 users are found (bot and 1 user)

            users.forEach(user => {
              let userTacos = 0;
              // check if user exists in DB
              client.exists(user, (error, reply) => {
                console.log(error, reply);

                if (reply === 1) {
                  client.get(user, (err, value) => {
                    console.log(err, value);
                    userTacos = parseInt(value) + parseInt(tacos);
                    client.set(user, parseInt(userTacos), (e, v) => {

                      if (e === null) {
                        console.log('in awarded');
                        awarded.push(user + ' has a total of ' + userTacos + '! \n');
                      }
                    });
                  });
                }
              });
            });

            data.form.text = `${tacos} tacos awarded to ${users.join(', ')} \n ${awarded.join('\n')}`; // add users to text sent as reply
          }

          request.post('https://slack.com/api/chat.postMessage', data, (error, response, body) => {
            res.json(); // sends message
            res.end(); // end connection
          });
        }
      }
    },
);