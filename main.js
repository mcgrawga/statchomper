var express = require('express');
var app = express();
var fs = require('fs');
var bs = require('./boxscore.json');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
var format = require('string-format');
format.extend(String.prototype);
var MongoClient = require('mongodb').MongoClient;
const MessagingResponse = require('twilio').twiml.MessagingResponse;


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// REMOVE UNWANTED CHARACTERS
function cleanStatLine(statLine){
    var validChars = "artbsf-123h";
    var cleanStatLine = [];
    for(var i = 0; i < statLine.length; i++){
        if (validChars.indexOf(statLine[i]) != -1)
           cleanStatLine.push(statLine[i]);
    }
    return cleanStatLine;
}


// COMBINE ARRAY CELLS THAT CONTAIN "-" WITH THE CELL TO THE RIGHT.
// FOR EXAMPLE [-][3] BECOMES [-3]
function combineStatLine(statArray){
    var tmpArray = [];
    for(var i = 0; i < statArray.length; i++){
        if (statArray[i] == "-"){
            tmpArray.push(statArray[i] + statArray[i+1]);
            i++;
        }
        else
            tmpArray.push(statArray[i]);
    }
    return tmpArray;
}


function fillInStats(statArray){
    var boxScore = JSON.parse(fs.readFileSync('./boxscore.json'));
    for(var i = 0; i < statArray.length; i++){
        var char = statArray[i];
        switch (char) {
            case "a":
                boxScore.assists++;
                break;
            case "r":
                boxScore.rebounds++;
                break;
            case "t":
                boxScore.turnovers++;
                break;
            case "b":
                boxScore.blocks++;
                break;
            case "s":
                boxScore.steals++;
                break;
            case "f":
                boxScore.fouls++;
                break;
            case "3":
                boxScore.threePointAttempts++;
                boxScore.threePointMade++;
                break;
            case "2":
                boxScore.twoPointAttempts++;
                boxScore.twoPointMade++;
                break;
            case "1":
                boxScore.freeThrowAttempts++;
                boxScore.freeThrowMade++;
                break;
            case "-3":
                boxScore.threePointAttempts++;
                break;
            case "-2":
                boxScore.twoPointAttempts++;
                break;
            case "-1":
                boxScore.freeThrowAttempts++;
                break;
        }
    }
    boxScore.points = boxScore.threePointMade * 3;
    boxScore.points += boxScore.twoPointMade * 2;
    boxScore.points += boxScore.freeThrowMade;
    boxScore.threePointPercentage = parseFloat((boxScore.threePointMade / boxScore.threePointAttempts).toFixed(2))*100;
    boxScore.twoPointPercentage = parseFloat((boxScore.twoPointMade / boxScore.twoPointAttempts).toFixed(2))*100;
    boxScore.freeThrowPercentage = parseFloat((boxScore.freeThrowMade / boxScore.freeThrowAttempts).toFixed(2))*100;
    if (isNaN(boxScore.threePointPercentage)){
        boxScore.threePointPercentage = 'n/a';
    }
    if (isNaN(boxScore.twoPointPercentage)){
        boxScore.twoPointPercentage = 'n/a';
    }
    if (isNaN(boxScore.freeThrowPercentage)){
        boxScore.freeThrowPercentage = 'n/a';
    }
    return boxScore;
}


function composeBoxScore(statArray){
    var firstHalfArray = [], secondHalfArray = [], gameArray = [];
    var halfTimeIndex = statArray.indexOf("h");
    if (halfTimeIndex != -1){
        firstHalfArray = statArray.slice(0, halfTimeIndex);
        secondHalfArray = statArray.slice(halfTimeIndex + 1);
        gameArray = firstHalfArray.concat(secondHalfArray);
    }
    var boxScore = {};
    boxScore.firstHalf = fillInStats(firstHalfArray);
    boxScore.secondHalf = fillInStats(secondHalfArray);
    boxScore.game = fillInStats(gameArray);
    return boxScore;
}


app.get('/basketball-statlines', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
        db.collection('bbStats', function (err, collection) {
            collection.find({}).toArray(function(err, result) {
                if (err) throw err;
                res.json(result);
                db.close();
            });
        });
    });
});


app.post('/sms-basketball', function(req, res) {
    const twiml = new MessagingResponse();
    var responseMessage;
    try {
        if ((req.body.Body.match(/\d{4}-\d{2}-\d{2}\s*:\s*\w+[\s\w]*:\s*\w+[\s\w]*:\s*[321ratsbf-]*h[321ratsbf-]*/) || []).length != 1){
            throw "Incorrect format.  You must send <yyyy-mm-dd>:<player>:<opponent>:<first half stats>h<second half stats>";
        }

        var statLineArray = req.body.Body.split(':');
        var date = statLineArray[0].trim();
        var player = statLineArray[1].trim();
        var opponent = statLineArray[2].trim();
        var statLine = statLineArray[3].trim();
        var statArray = combineStatLine(cleanStatLine(statLine));
        var bs = composeBoxScore(statArray);

        // Store statline, box score and date in db.
        // MongoClient.connect("mongodb://localhost:27017/statchomper_bb", function (err, db) {
        MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
            db.collection('bbStats', function (err, collection) {
                const statObject = {};
                statObject.player = player;
                statObject.datePlayed = date;
                statObject.opponent = opponent;
                statObject.statLine = req.body.Body;
                statObject.boxScore = bs;
                collection.insert(statObject);
            });
        });
        responseMessage = 'Points: {points}, Assists: {assists}, Rebounds: {rebounds}, Turnovers: {turnovers}, Blocks: {blocks}, Steals: {steals}, Fouls: {fouls}, Threepointers: {threePointMade} for {threePointAttempts}, Three point %: {threePointPercentage}, Twopointers: {twoPointMade} for {twoPointAttempts}, Two point %: {twoPointPercentage}, Freethrows: {freeThrowMade} for {freeThrowAttempts}, Freethrow %: {freeThrowPercentage}'.format(bs.game);
        responseMessage = `${player}'s stats on ${date} vs. ${opponent}:  ${responseMessage}`;

    } catch(err){
        responseMessage = err;
    }
    twiml.message(responseMessage);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});


app.set('port', (process.env.PORT || 5000)); 
var server = app.listen(app.get('port'), function () {
   console.log("Statchomper listening at port ",app.get('port'));
});
 
module.exports = app;
