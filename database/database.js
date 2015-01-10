/**
 * Created by Majid on 1/9/2015.
 */

var SMSCenter = require('./model/sms').SMSCenterModel;
var Outbox = require('./model/sms').OutboxModel;
var Inbox = require('./model/sms').InboxModel;

var logger = require('../utility/logger');
function Database() {
    function getSMSCenterByName(name, errCallback, notFoundCallback, findcallback, findCallbackObject) {
        SMSCenter.findOne({name: name}).exec(function (err, smsc) {
            if (err) {

                console.log(err);
                if (errCallback)
                    errCallback(err);
            }
            else if (!smsc) {
                console.log("not found");
                if (notFoundCallback)
                    notFoundCallback();
            }
            else {
                console.log("found");
                if (findcallback) {
                    findcallback(smsc.name, smsc.username, smsc.password, smsc.url, smsc.id, smsc.number);
                }
                findCallbackObject && findCallbackObject(smsc);
            }
        });
    }

    function getSMSCenters(errCallback, successfulCallback) {
        SMSCenter.find().exec(function (err, smscs) {
            if (err) {
                if (errCallback) {
                    logger.error(err);
                    errCallback(err);
                }
            }
            else {
                if (successfulCallback) {
                    logger.debug("successfully find : " + smscs);
                    successfulCallback(smscs)
                }
            }
        });
    }

    function createSMSCenter(name, userName, password, url, number) {
        logger.debug("create sms center : " + name + " : " + userName + " : " + password + " : " + url);
        var newSMSCenter = new SMSCenter({
            name: name,
            username: userName,
            password: password,
            url: url,
            createDate: (new Date()).AsDateJs(),
            number: number
        });
        return newSMSCenter;
    }

    function insertSMSCToDatabase(model, errCallback, successfulCallback) {
        logger.debug("insert new smsc to database : " + model);
        model.save(function (err) {
            if (err) {
                logger.error(err);
                if (errCallback)
                    errCallback(err)
            }
            else {
                logger.debug("successfully inserted to the database");
                if (successfulCallback)
                    successfulCallback(model)
            }
        });
    }

    function changeTheSMSCenterStatus(name, status, errCallback, notFoundCallback, successfullyCallback) {
        logger.debug("change the status of the sms center to : " + status);
        getSMSCenterByName(name, errCallback, notFoundCallback, null, function (smsc) {
            smsc.status = status;
            smsc.save(function (saveErr) {
                if (saveErr) {
                    logger.error(saveErr);
                    if (errCallback)
                        errCallback(saveErr);
                }
                else {
                    logger.debug("successfully save the status");
                    if (successfullyCallback)
                        successfullyCallback(smsc);
                }

            });
        })
    }

    function changeTheSMSCenterNumber(name, number, errCallback, notFoundCallback, successfullyCallback) {
        logger.debug("change the number of the sms center to : " + number);
        getSMSCenterByName(name, errCallback, notFoundCallback, null, function (smsc) {
            smsc.number = number;
            smsc.save(function (saveErr) {
                if (saveErr) {
                    logger.error(saveErr);
                    if (errCallback)
                        errCallback(saveErr);
                }
                else {
                    logger.debug("successfully save the number");
                    if (successfullyCallback)
                        successfullyCallback(smsc);
                }

            });
        })
    }

    function markAsSent(outbox){
        outbox.status = true;
        outbox.save();
    }

    function addSMSToOutbox(moduleId, to, body, errCallback, successfullyCallback){
        try{
            var outBox = new Outbox({
                providerId: moduleId,
                body: body,
                sendDate: (new Date()).AsDateJs(),
                to: to,
                status: false
            });
            outBox.save(function(err){
                if(err){
                    logger.error(err);
                    if(errCallback)
                        errCallback(err);
                }
                else{
                    logger.debug("sms has been added to the outbox : " + outBox);
                    if(successfullyCallback)
                        successfullyCallback(outBox);
                }
            });
        }
        catch(ex){
            logger.error(ex);
        }
    }

    function addSMSToInbox(moduleId, from, to, body, errCallback, successfullyCallback){
        try{
            var inbox = new inbox({
                providerId: moduleId,
                body: body,
                rcvDate: (new Date()).AsDateJs(),
                from: from
            });
            inbox.save(function(err){
                if(err){
                    logger.error(err);
                    if(errCallback)
                        errCallback(err);
                }
                else{
                    logger.debug("sms has been added to the database : " + inbox);
                    if(successfullyCallback)
                        successfullyCallback(inbox);
                }
            });
        }
        catch(ex){
            logger.error(ex);
        }
    }

    return {
        getSMSCenterByName: getSMSCenterByName,
        createSMSCenter: createSMSCenter,
        insertSMSCToDatabase: insertSMSCToDatabase,
        getSMSCenters: getSMSCenters,
        changeSMSCStatus: changeTheSMSCenterStatus,
        changeSMSCNumber: changeTheSMSCenterNumber,
        addSMSToOutbox: addSMSToOutbox,
        addSMSToInbox: addSMSToInbox
    };
}

module.exports.Database = Database;