var kue = require('kue');
var jobs = kue.createQueue();
var logger = require('../utility/logger');
var modules = require('../modules/modules').Modules;

var taskManager = function () {
    var sendSMSJob = function (sms, errCallback, successCallback) {
        try {
            console.log(sms);
            sms.title = "send sms to : " + sms.to;
            var job = jobs.create('send sms', sms).save();
            job.on('complete', function () {
                logger.info(job.id + " : " + job.data.id + " is done");
            })
            job.on('failed', function () {
                logger.info(job.id + " : " + job.data.id + " has failed");
            })
            successCallback && successCallback();
        }
        catch (ex) {
            logger.error(ex);
            errCallback && errCallback(ex);
        }
    }

    var initMonitoring = function (port) {
        try {
            kue.app.listen(port);
        }
        catch (ex) {
            logger.error(ex);
        }
    }

    jobs.process('send sms', function (job, done) {
        try {
            modules().reloadModules(function (smsModules) {
                try {
                    console.log(job.data.providerId);
                    smsModules[job.data.providerId].sendSMS(job.data.to, job.data.body, function () {
                        console.log(job.data);
                        job.data.status = true;
                        job.save();
                        done && done();
                    }, function (err) {
                        console.log(err);
                        return done(err);
                    })
               }
                catch(ex){
                    console.log(ex);
                }
            });
        }
        catch (ex) {
            console.log(ex);
        }
    });

    return{
        sendSMS: sendSMSJob,
        initMonitoring: initMonitoring
    }
}

module.exports.TaskManager = taskManager;