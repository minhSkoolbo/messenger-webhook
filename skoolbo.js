const 
    request = require('request');

const skoolbo_api_uri = "https://api.skoolbo.com.au/"

function Skoolbo(data) {

}

Skoolbo.get = function(req, res) {
    request({
        "uri": skoolbo_api_uri,
        "method": "GET",
    }, (err, res2, body) => {
        if (!err) {
            return res.json(200, {
                err: err,
                body: body
            });
        } else {
            console.error("Err:" + err);
        }
    });
}

Skoolbo.game_demo = function(req, res) {
    request({
        "uri": skoolbo_api_uri + 'api/v1/Public/game_demo?categoryCode=109&course=en_lit',
        "method": "GET",
    }, (err, res2, body) => {
        if (!err) {
            return res.status(200).send(JSON.parse(body).data.template.questions[0]);
        } else {
            console.error("Err:" + err);
        }
    });
}



exports.Skoolbo = Skoolbo;
