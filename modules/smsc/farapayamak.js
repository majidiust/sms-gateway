var BaseModule = require('../baseModule');
var util = require('util');
var soap = require('soap');
var request = require('request');

function FaraPayamakModule(readyCallback) {
    BaseModule.call(this);
    this.setModuleName('farapayamak');
    this.init(readyCallback);
}


util.inherits(FaraPayamakModule, BaseModule);

FaraPayamakModule.prototype.sendSMS = function (to, body, successCallback, errorCallback) {

    console.log("##################################################");
    try {
        try{
//            request.post({
//                headers: {'content-type': 'application/x-www-form-urlencoded'},
//                form: { number: to, message: body},
//                url: 'http://localhost:3000/telegram/sendTelegramMessage'
//            });
//            request.post({
//                headers: {'content-type': 'application/x-www-form-urlencoded'},
//                form: { number: to, message: body},
//                url: 'http://localhost:3000/telegram/sendTelegramMessage'
//            });
        }
        catch(exx){
            console.log(exx);
        }
        var url = 'http://api.payamak-panel.com/post/send.asmx?wsdl';
        var tos = new Array;
        tos.push(to);
        var args = {
            username: this.moduleInfo.userName,
            password: this.moduleInfo.password,
            to: {string : [to]},
            from: this.moduleInfo.number,
            text: body,
            isflash: false
        }

        console.log(args);
        soap.createClient(url, function (err, client) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Try to make call");
                client.SendSimpleSMS(args, function (err, results) {
                    if(err){
                        console.log(err)
                        errorCallback && errorCallback(err);
                    }
                    else{
                        console.log("Succcess");
                        successCallback && successCallback(results);
                    }
                });
            }
        });
    }
    catch (ex) {
        console.log(ex);
        res.send(ex, 500);
    }
};

FaraPayamakModule.prototype.getSMS = function (from, to, body) {
    try {
    }
    catch (ex) {
        logger.error(ex);
    }
};

module.exports = FaraPayamakModule;
