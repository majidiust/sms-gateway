var express = require('express');
var jwt = require("jwt-simple");
var moment = require("moment");
var datejs = require("safe_datejs");
var jalali_moment = require("moment-jalaali");
var router = express.Router();
var Database = require('../database/database').Database;
var logger = require('../utility/logger');
var taskManager = require('../queue/task').TaskManager;

function addSMSCenter(req, res) {
    try {
        var name = req.body.name;
        var username = req.body.username;
        var password = req.body.password;
        var url = req.body.url;
        var number = req.body.number;
        logger.debug("add sms center to the database : " + name + " : " + username + " : " + password + " : " + url);
        Database().getSMSCenterByName(name, function (err) {
            res.send(err, 500);
        }, function () {
            Database().insertSMSCToDatabase(Database().createSMSCenter(name, username, password, url, number), function (err) {
                res.send(err, 500);
            }, function (smsc) {
                res.json(smsc);
            });
        }, function (smsc) {
            res.send("Created before", 409);
        })
    }
    catch (ex) {
        res.send(ex, 500);
    }
}

function getSMSCenterByName(req, res) {
    try {
        var name = req.body.name;
        Database().getSMSCenterByName(name, function (err) {
            res.send(err, 500);
        }, function () {
            res.send("not found", 404);
        }, function (name, userName, password, url, id) {
            res.json({name: name, url: url, id: id});
        });
    }
    catch (ex) {
        res.send(ex, 500);
    }
}

function getListOfSMSCenters(req, res) {
    try {
        Database().getSMSCenters(function (err) {
            res.send(err, 500);
        }, function (smscs) {
            res.json(smscs);
        })
    }
    catch (ex) {
        res.send(ex, 500);
    }
}

function changeSMSCStatus(req, res) {
    try {
        var name = req.body.name;
        var status = req.body.status;
        Database().changeSMSCStatus(name, status, function (err) {
            res.send(err, 500);
        }, function () {
            res.send("not found", 404);
        }, function (smsc) {
            res.json(smsc);
        })
    }
    catch (ex) {
        res.send(ex, 500);
    }
}


function changeSMSCNumber(req, res) {
    try {
        var name = req.body.name;
        var number = req.body.number;
        Database().changeSMSCNumber(name, number, function (err) {
            res.send(err, 500);
        }, function () {
            res.send("not found", 404);
        }, function (smsc) {
            res.json(smsc);
        })
    }
    catch (ex) {
        res.send(ex, 500);
    }
}

function sendSMS(req, res){
    var moduleId = req.body.moduleId;
    var to = req.body.to;
    var body = req.body.body;
    console.log(moduleId + " : " + to  + " : " + body);
    try{
        logger.debug("send sms to the : " + moduleId + " : " + to  + " : " + body);
        Database().addSMSToOutbox(moduleId, to, body, function(err){
            res.send(err, 500)
        }, function(sms){
            taskManager().sendSMS(sms, function(err){
                res.send(err, 500);
            }, function(){
                res.send("send");
            })
        })
    }
    catch(ex){
        logger.error(ex);
        res.send(ex, 500);
    }
}


function sendSMSByModuleName(req, res){
    var name = req.body.name;
    var to = req.body.to;
    var body = req.body.body;
    console.log(name + " : " + to  + " : " + body);
    try{

        Database().getSMSCenterByName(name, function (err) {
            res.send(err, 500);
        }, function () {
            res.send("not found", 404);
        }, null, function (smsc) {
            console.log(smsc.id);
            Database().addSMSToOutbox(smsc.id, to, body, function(err){
                res.send(err, 500)
            }, function(sms){
                taskManager().sendSMS(sms, function(err){
                    res.send(err, 500);
                }, function(){
                    res.send("send");
                })
            })
        });
    }
    catch(ex){
        logger.error(ex);
        res.send(ex, 500);
    }
}

router.route('/addSMSCenter').post(addSMSCenter);
router.route('/getSMSCenterByName').post(getSMSCenterByName);
router.route('/getListOfSMSCenters').post(getListOfSMSCenters);
router.route('/changeSMSCenterStatus').post(changeSMSCStatus);
router.route('/changeSMSCenterNumber').post(changeSMSCNumber);
router.route('/sendSMSById').post(sendSMS);
router.route('/sendSMSByName').post(sendSMSByModuleName);

module.exports = router;