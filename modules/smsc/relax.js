var BaseModule = require('../baseModule');
var util = require('util');
var soap = require('soap');
var request = require('request');

function RelaxModule(readyCallback) {
    BaseModule.call(this);
    this.setModuleName('relax');
    this.init(readyCallback);
}

util.inherits(RelaxModule, BaseModule);

RelaxModule.prototype.sendSMS = function (to, body, successCallback, errorCallback) {
    try {
        request.post({
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            url: 'http://87.107.121.52/post/sendsms.ashx?from=' + this.moduleInfo.number + '&to=' + to + '&text=' + body + '&password=' + this.moduleInfo.password + '&username=' + this.moduleInfo.userName
        }, function (error, response, body) {
            if (error)
                errorCallback && errorCallback(err)
            else
                successCallback && successCallback();
            console.log(body);
        });
    }
    catch (ex) {
        console.log(ex);
        res.send(ex, 500);
    }
};

RelaxModule.prototype.getSMS = function (from, to, body) {
    try {
    }
    catch (ex) {
        logger.error(ex);
    }
};

module.exports = RelaxModule;
