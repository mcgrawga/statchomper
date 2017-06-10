var express = require('express');
var app = express();
var fs = require('fs');
var bs = require('./boxscore.json');
 
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
 
app.get('/basketball/:statline', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.params.statline.indexOf("h") == -1){
        res.status(400).send(JSON.stringify("You must have a halftime character 'h' in your statline."));
    }else{
        var statArray = combineStatLine(cleanStatLine(req.params.statline));
        var bs = composeBoxScore(statArray);
        res.send(JSON.stringify(bs));
    }
});
 
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Statchomper listening at http://%s:%s", host, port)
});
 
module.exports = app;
