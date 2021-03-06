//import { read } from 'fs';

'use strict';

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()); // creates express http server

var
    Skoolbo = require('./skoolbo.js').Skoolbo,
    Vocab = require('./vocab.js').Vocab;

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the message. entry.messaging is an array, but 
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event.message);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

app.get('/', (req, res) => {
    res.status(200).send('MessGame v0.1');
});

app.get('/skoolbo', (req, res) => {
    Skoolbo.get(req, res);
    //res.status(200).send('MessGame v0.1');
});

app.get('/skoolbo/game_demo', (req, res) => {
    Skoolbo.game_demo(req, res);
    //res.status(200).send('MessGame v0.1');
});



// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>"

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {
        if (received_message.text.toLowerCase() == 'play' || received_message.text.toLowerCase() == 'ok') {
            // create a math question
            response = generateQuestion(sender_psid, 0, 0, 0);
        }
        else if (~~received_message.text) { // a number
            let seed = ~~received_message.text;
            response = generateQuestion(sender_psid, 0, 0, seed);
        }
        else {
            // Create the payload for a basic text message
            // response = {
            //     "text": `You said: "${received_message.text}". Would you like to Play a game or learn Vocab?`
            // }
            response = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": `You said: "${received_message.text}". Would you like to Play a game or learn Vocab?`,
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Game",
                                    "payload": 'play',
                                },
                                {
                                    "type": "postback",
                                    "title": "Vocab",
                                    "payload": 'vocab',
                                }
                            ],
                        }]
                    }
                }
            }
        }
    }
    else if (received_message.attachments) {
        // Gets the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }

    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

function generateQuestion(sender_psid, question_idx, score, seed) {
    let x, y;
    if (!~~seed) {
        seed = 20;
        x = Math.floor(Math.random() * seed);
        y = Math.floor(Math.random() * seed);
    }
    else {
        if (Math.random() < 0.5) {
            x = ~~seed;
            y = Math.floor(Math.random() * 13);
        }
        else {
            x = Math.floor(Math.random() * 13);
            y = seed;
        }
    }
    let a1 = x * (y + Math.floor(Math.random() * 3) - 1);
    let a2 = x * (y + Math.floor(Math.random() * 3) - 1);
    if (a1 == a2) a2 = a2 + (x ? x : y);
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": x + " * " + y + " = ?",
                    "subtitle": `${score}/${question_idx}. Choose the correct answer`,
                    "buttons": [
                        {
                            "type": "postback",
                            "title": a1,
                            "payload": `${question_idx}|${a1 == x * y ? 1 : 0}|${score}|${seed}`,
                        },
                        {
                            "type": "postback",
                            "title": a2,
                            "payload": `${question_idx}|${a2 == x * y ? 1 : 0}|${score}|${seed}`,
                        },
                        {
                            "type": "postback",
                            "title": "None of the above",
                            "payload": `${question_idx}|${a1 != x * y && a2 != x * y ? 1 : 0}|${score}|${seed}`,
                        }
                    ],
                }]
            }
        }
    }
    return response;
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;
    console.log('Received payload: ' + payload);
    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
    }
    else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
    }
    else if (payload === 'play') {
        response = generateQuestion(sender_psid, 0, 0, 0);
    }
    else if (payload === 'quit') {
        response = { "text": "Thank you. See you next time!" }
    }
    else if (payload === 'vocab') {
        let nextWord = Vocab.nextWord();
        //response = { "text": "Here is the words for you to learn today:" + nextWord }
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    //"top_element_style": "compact",
                    "elements": [
                        {
                            "title": nextWord,
                            "subtitle": "definition below",
                            "default_action": {
                                "type": "web_url",
                                "url": `${Vocab.dictionaryEng(nextWord)}`,
                                "messenger_extensions": false,
                                "webview_height_ratio": "tall"
                            },
                            "buttons": [
                                {
                                    "title": "Vietnamese translation",
                                    "type": "web_url",
                                    "url": `${Vocab.translateEngVie(nextWord)}`,
                                    "messenger_extensions": false,
                                    "webview_height_ratio": "tall"
                                },
                                {
                                    "type": "postback",
                                    "title": "Learn another",
                                    "payload": 'vocab',
                                },
                                {
                                    "type": "postback",
                                    "title": "Quit",
                                    "payload": 'quit',
                                }
                            ]
                        },
                    ]
                }
            }
        }
    }
    else if (payload.includes('|')) {
        let a = payload.split('|');
        let question_idx = ~~a[0];
        let answer = ~~a[1];
        let score = ~~a[2];
        let seed = ~~a[3];
        if (answer == 1) {
            ++score;
            response = { "text": "Correct! +1" }
        }
        else {
            response = { "text": "Oops, wrong answer!" }
        }

        if (question_idx < 9) {
            callSendAPI(sender_psid, response);

            response = generateQuestion(sender_psid, question_idx + 1, score, seed);
            callSendAPI(sender_psid, response);
            return;
        }
        else {
            response = { "text": `Game Over. Score = ${score} / ${question_idx + 1}` }
            callSendAPI(sender_psid, response);

            response = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Do you want to play another game?",
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Yes",
                                    "payload": 'play',
                                },
                                {
                                    "type": "postback",
                                    "title": "No",
                                    "payload": 'quit',
                                }
                            ],
                        }]
                    }
                }
            }
        }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}
