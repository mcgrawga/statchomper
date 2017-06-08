"use strict";
var assert = require('assert');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../main');
 
var should = chai.should();
chai.use(chaiHttp);
var expect = chai.expect;
 
var keysArray = [
    "assists",
    "rebounds",
    "turnovers",
    "blocks",
    "steals",
    "fouls",
    "threePointAttempts",
    "threePointMade",
    "threePointPercentage",
    "twoPointAttempts",
    "twoPointMade",
    "twoPointPercentage",
    "freeThrowAttempts",
    "freeThrowMade",
    "freeThrowPercentage",
    "points"
];
 
describe('Basketball', function() {
    it('Should return a 400 status code', function(done) {
        chai.request(server)
        .get('/basketball/123321')
        .end(function(err, res){
            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.equal("You must have a halftime character 'h' in your statline.");
            done();
        });
    });
    it('Should return proper stats', function(done) {
        chai.request(server)
        .get('/basketball/123123-1-2-3arbstfh123123-1-2-3arbstf')
        .end(function(err, res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.have.all.keys("firstHalf", "secondHalf", "game");
            res.body.firstHalf.should.have.all.keys(keysArray);
            res.body.firstHalf.assists.should.be.equal(1);
            res.body.firstHalf.rebounds.should.be.equal(1);
            res.body.firstHalf.turnovers.should.be.equal(1);
            res.body.firstHalf.blocks.should.be.equal(1);
            res.body.firstHalf.steals.should.be.equal(1);
            res.body.firstHalf.fouls.should.be.equal(1);
            res.body.firstHalf.threePointAttempts.should.be.equal(3);
            res.body.firstHalf.threePointMade.should.be.equal(2);
            res.body.firstHalf.threePointPercentage.should.be.equal(.67);
            res.body.firstHalf.twoPointAttempts.should.be.equal(3);
            res.body.firstHalf.twoPointMade.should.be.equal(2);
            res.body.firstHalf.twoPointPercentage.should.be.equal(.67);
            res.body.firstHalf.freeThrowAttempts.should.be.equal(3);
            res.body.firstHalf.freeThrowMade.should.be.equal(2);
            res.body.firstHalf.freeThrowPercentage.should.be.equal(.67);
            res.body.firstHalf.points.should.be.equal(12);
 
            res.body.secondHalf.should.have.all.keys(keysArray);
            res.body.secondHalf.assists.should.be.equal(1);
            res.body.secondHalf.rebounds.should.be.equal(1);
            res.body.secondHalf.turnovers.should.be.equal(1);
            res.body.secondHalf.blocks.should.be.equal(1);
            res.body.secondHalf.steals.should.be.equal(1);
            res.body.secondHalf.fouls.should.be.equal(1);
            res.body.secondHalf.threePointAttempts.should.be.equal(3);
            res.body.secondHalf.threePointMade.should.be.equal(2);
            res.body.secondHalf.threePointPercentage.should.be.equal(.67);
            res.body.secondHalf.twoPointAttempts.should.be.equal(3);
            res.body.secondHalf.twoPointMade.should.be.equal(2);
            res.body.secondHalf.twoPointPercentage.should.be.equal(.67);
            res.body.secondHalf.freeThrowAttempts.should.be.equal(3);
            res.body.secondHalf.freeThrowMade.should.be.equal(2);
            res.body.secondHalf.freeThrowPercentage.should.be.equal(.67);
            res.body.secondHalf.points.should.be.equal(12);
       
            res.body.game.should.have.all.keys(keysArray);
            res.body.game.assists.should.be.equal(2);
            res.body.game.rebounds.should.be.equal(2);
            res.body.game.turnovers.should.be.equal(2);
            res.body.game.blocks.should.be.equal(2);
            res.body.game.steals.should.be.equal(2);
            res.body.game.fouls.should.be.equal(2);
            res.body.game.threePointAttempts.should.be.equal(6);
            res.body.game.threePointMade.should.be.equal(4);
            res.body.game.threePointPercentage.should.be.equal(.67);
            res.body.game.twoPointAttempts.should.be.equal(6);
            res.body.game.twoPointMade.should.be.equal(4);
            res.body.game.twoPointPercentage.should.be.equal(.67);
            res.body.game.freeThrowAttempts.should.be.equal(6);
            res.body.game.freeThrowMade.should.be.equal(4);
            res.body.game.freeThrowPercentage.should.be.equal(.67);
            res.body.game.points.should.be.equal(24);
            done();
        });
    });
});