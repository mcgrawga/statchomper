var express = require('express');
var app = express();
var fs = require('fs');
var bs = require('./boxscore.json');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
var format = require('string-format');
format.extend(String.prototype);
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MessagingResponse = require('twilio').twiml.MessagingResponse;


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// REMOVE UNWANTED CHARACTERS
function cleanStatLine(statLine){
    var validChars = "artbsf-123";
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


function composeBoxScore(statArray){
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
    boxScore.threePointPercentage = Math.round((boxScore.threePointMade / boxScore.threePointAttempts)*100);
    boxScore.twoPointPercentage = Math.round((boxScore.twoPointMade / boxScore.twoPointAttempts)*100);
    boxScore.freeThrowPercentage = Math.round((boxScore.freeThrowMade / boxScore.freeThrowAttempts)*100);
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


app.get('/basketball-statlines', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, function (err, client) {
        if (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({ error: 'Database connection failed', details: err.message });
        }
        var db = client.db('stats');
        db.collection('bbStats', function (err, collection) {
            if (req.query.sort === undefined) {
                collection.find({}, {sort: [['datePlayed', 'desc']]}).toArray(function(err, result) {
                    if (err) throw err;
                    res.json(result);
                    client.close();
                });
            } else if (req.query.sort === 'player'){
                collection.find({}, {sort: [['player', 'asc'], ['datePlayed', 'desc']]}).toArray(function(err, result) {
                    if (err) throw err;
                    res.json(result);
                    client.close();
                });
            } else {
                res.status(422).json({ error: 'Unrecognized sort parameter' });
            }
        });
    });
});

app.get('/basketball-statlines/:player', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, function (err, client) {
        if (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({ error: 'Database connection failed', details: err.message });
        }
        var db = client.db('stats');
        db.collection('bbStats', function (err, collection) {
            collection.find({player: req.params.player}, {sort: [['datePlayed', 'desc']]}).toArray(function(err, result) {
                if (err) throw err;
                res.json(result);
                client.close();
            });
        });
    });
});

app.get('/basketball-statline/:id', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    
    // Validate ObjectId format
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid game ID format' });
    }
    
    MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, function (err, client) {
        if (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({ error: 'Database connection failed', details: err.message });
        }
        var db = client.db('stats');
        db.collection('bbStats', function (err, collection) {
            collection.findOne({_id: ObjectId(req.params.id)}, function(err, result) {
                if (err) {
                    client.close();
                    console.error('Error finding game:', err);
                    return res.status(500).json({ error: 'Error finding game', details: err.message });
                }
                if (!result) {
                    client.close();
                    return res.status(404).json({ error: 'Game not found' });
                }
                res.json(result);
                client.close();
            });
        });
    });
});

app.get('/basketball-players', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, function (err, client) {
        if (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({ error: 'Database connection failed', details: err.message });
        }
        var db = client.db('stats');
        db.collection('bbStats', function (err, collection) {
            collection.distinct('player', {}, function(err, result) {
                if (err) throw err;
                res.json(result.sort());
                client.close();
            });
        });
    });
});


app.post('/sms-basketball', function(req, res) {
    const twiml = new MessagingResponse();
    var responseMessage;
    try {
        if ((req.body.Body.match(/\d{4}-\d{2}-\d{2}\s*:\s*\w+[\s\w]*:\s*\w+[\s\w]*:\s*[321ratsbf-]*$/) || []).length != 1){
            throw "Incorrect format.  You must send <yyyy-mm-dd>:<player>:<opponent>:<game stats>";
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
        
        MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, function (err, client) {
            if (err) {
                console.error('MongoDB connection error:', err);
                return res.status(500).send('Database connection failed: ' + err.message);
            }
            var db = client.db('stats');
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
        let twoPointPercentage = bs.twoPointPercentage;
        if (twoPointPercentage !== 'n/a'){
            twoPointPercentage = `${twoPointPercentage}%`;
        }
        let threePointPercentage = bs.threePointPercentage;
        if (threePointPercentage !== 'n/a'){
            threePointPercentage = `${threePointPercentage}%`;
        }
        let freeThrowPercentage = bs.freeThrowPercentage;
        if (freeThrowPercentage !== 'n/a'){
            freeThrowPercentage = `${freeThrowPercentage}%`;
        }
        responseMessage = `Points: {points}, Assists: {assists}, Rebounds: {rebounds}, Turnovers: {turnovers}, Blocks: {blocks}, Steals: {steals}, Fouls: {fouls}, 
            Threepointers: {threePointMade} for {threePointAttempts} (${threePointPercentage}), 
            Twopointers: {twoPointMade} for {twoPointAttempts} (${twoPointPercentage}), 
            Freethrows: {freeThrowMade} for {freeThrowAttempts} (${freeThrowPercentage})`.format(bs);
        responseMessage = `${player}'s stats on ${date} vs. ${opponent}:  ${responseMessage}`;
        responseMessage = `${responseMessage}  https://statchomper-ui.herokuapp.com`;

    } catch(err){
        responseMessage = err;
    }
    twiml.message(responseMessage);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});


app.put('/sms-basketball/:id', function(req, res) {
    const twiml = new MessagingResponse();
    var responseMessage;
    try {
        // Validate MongoDB ObjectId format
        const ObjectId = require('mongodb').ObjectId;
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            throw "Invalid ID format. ID must be a 24-character hex string.";
        }
        
        if ((req.body.Body.match(/\d{4}-\d{2}-\d{2}\s*:\s*\w+[\s\w]*:\s*\w+[\s\w]*:\s*[321ratsbf-]*$/) || []).length != 1){
            throw "Incorrect format.  You must send <yyyy-mm-dd>:<player>:<opponent>:<game stats>";
        }

        var statLineArray = req.body.Body.split(':');
        var date = statLineArray[0].trim();
        var player = statLineArray[1].trim();
        var opponent = statLineArray[2].trim();
        var statLine = statLineArray[3].trim();
        var statArray = combineStatLine(cleanStatLine(statLine));
        var bs = composeBoxScore(statArray);

        // Update existing document in dbd
        MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, function (err, client) {
            if (err) {
                console.error('MongoDB connection error:', err);
                return res.status(500).send('Database connection failed: ' + err.message);
            }
            var db = client.db('stats');
            db.collection('bbStats', function (err, collection) {
                try {
                    const statObject = {};
                    statObject.player = player;
                    statObject.datePlayed = date;
                    statObject.opponent = opponent;
                    statObject.statLine = req.body.Body;
                    statObject.boxScore = bs;
                    
                    // Use replaceOne to replace the entire document
                    collection.replaceOne(
                        { _id: new ObjectId(req.params.id) },
                        statObject,
                        function(err, result) {
                            if (err) {
                                console.error('Update error:', err);
                                client.close();
                                return;
                            }
                            if (result.matchedCount === 0) {
                                console.log('No document found with id:', req.params.id);
                            } else {
                                console.log('Document updated successfully');
                            }
                            client.close();
                        }
                    );
                } catch (dbErr) {
                    console.error('Database operation error:', dbErr);
                    client.close();
                    return res.status(400).send('Database operation failed: ' + dbErr.message);
                }
            });
        });
        let twoPointPercentage = bs.twoPointPercentage;
        if (twoPointPercentage !== 'n/a'){
            twoPointPercentage = `${twoPointPercentage}%`;
        }
        let threePointPercentage = bs.threePointPercentage;
        if (threePointPercentage !== 'n/a'){
            threePointPercentage = `${threePointPercentage}%`;
        }
        let freeThrowPercentage = bs.freeThrowPercentage;
        if (freeThrowPercentage !== 'n/a'){
            freeThrowPercentage = `${freeThrowPercentage}%`;
        }
        responseMessage = `Points: {points}, Assists: {assists}, Rebounds: {rebounds}, Turnovers: {turnovers}, Blocks: {blocks}, Steals: {steals}, Fouls: {fouls}, 
            Threepointers: {threePointMade} for {threePointAttempts} (${threePointPercentage}), 
            Twopointers: {twoPointMade} for {twoPointAttempts} (${twoPointPercentage}), 
            Freethrows: {freeThrowMade} for {freeThrowAttempts} (${freeThrowPercentage})`.format(bs);
        responseMessage = `${player}'s stats on ${date} vs. ${opponent}:  ${responseMessage}`;
        responseMessage = `${responseMessage}  https://statchomper-ui.herokuapp.com`;

    } catch(err){
        responseMessage = err;
    }
    twiml.message(responseMessage);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});


app.delete('/sms-basketball/:id', function(req, res) {
    try {
        // Validate MongoDB ObjectId format
        const ObjectId = require('mongodb').ObjectId;
        if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid ID format. ID must be a 24-character hex string.' });
        }

        // Delete document from db
        MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, function (err, client) {
            if (err) {
                console.error('MongoDB connection error:', err);
                return res.status(500).json({ error: 'Database connection failed', details: err.message });
            }
            var db = client.db('stats');
            db.collection('bbStats', function (err, collection) {
                try {
                    collection.deleteOne(
                        { _id: new ObjectId(req.params.id) },
                        function(err, result) {
                            if (err) {
                                console.error('Delete error:', err);
                                client.close();
                                return res.status(500).json({ error: 'Delete operation failed', details: err.message });
                            }
                            if (result.deletedCount === 0) {
                                console.log('No document found with id:', req.params.id);
                                client.close();
                                return res.status(404).json({ error: 'Document not found' });
                            } else {
                                console.log('Document deleted successfully');
                                client.close();
                                return res.status(200).json({ message: 'Document deleted successfully' });
                            }
                        }
                    );
                } catch (dbErr) {
                    console.error('Database operation error:', dbErr);
                    client.close();
                    return res.status(400).json({ error: 'Database operation failed', details: dbErr.message });
                }
            });
        });
    } catch(err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
});


app.set('port', (process.env.PORT || 3000)); 
var server = app.listen(app.get('port'), function () {
   console.log("Statchomper listening at port ",app.get('port'));
});
 
module.exports = app;
