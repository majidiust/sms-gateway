var utility = require('../utility/moduleUtility');
var baseModule = require('./baseModule').BaseModule;
var logger = require('../utility/logger');

var modules = function () {
    var smsModules = {};
    var reloadModules = function (reloadedCallback) {
        console.log("load all sms modules");
        console.log(__dirname + '/../modules/smsc');
        utility.loadModules({
            folder: __dirname + '/../modules/smsc',
            filter: undefined // either undefined or a filter function for module names
        }, function (modules) {
            console.log("module loaded : " + modules.length);
            modules.forEach(function (module) {
                try {
                    console.log(module.getModuleId());
                    smsModules[module.getModuleId()] =  module;
                }
                catch(ex){
                    console.log(ex);
                }
            });

            reloadedCallback && reloadedCallback(smsModules);
        });
    }
    return {
        reloadModules: reloadModules
    }
}

module.exports.Modules = modules;