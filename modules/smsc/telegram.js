var BaseModule = require('../baseModule');
var util = require('util');
var request = require('request');

function TelegramModule(readyCallback) {
    BaseModule.call(this);
    this.setModuleName('telegram');
    this.init(readyCallback);
}


util.inherits(TelegramModule, BaseModule);

TelegramModule.prototype.sendSMS = function (to, body, successCallback, errorCallback) {

    console.log("##################################################");

    console.log(body);
    var callNumber = to;
    console.log("number : " + callNumber);
    var message = body ? body : "No Message";
    try{
	     request.post({
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            form: { number: to, message: body},
            url: 'http://localhost:3000/telegram/sendTelegramMessage'
        });
         request.post({
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            form: { number: to, message: body},
            url: 'http://localhost:3000/telegram/sendTelegramMessage'
        }, function (error, response, body) {
            if (error)
                errorCallback && errorCallback(err)
            else
                successCallback && successCallback();
            console.log(body);
        });
    }
    catch(ex){
        errorCallback && errorCallback(ex);
    }
};

TelegramModule.prototype.getSMS = function (from, to, body) {
    try {
    }
    catch (ex) {
        logger.error(ex);
    }
};

module.exports = TelegramModule;
