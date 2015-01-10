var Database = require('../database/database').Database;
var logger = require('../utility/logger');

var BaseModule = function () {
    this.moduleInfo = {
        name: "base_module",
        id: null,
        userName: null,
        password: null,
        url: null,
        number: null
    }
}

BaseModule.prototype.getModuleName = function getModuleName() {
    return this.moduleInfo.name
}

BaseModule.prototype.getModuleId = function getModuleId() {
    return this.moduleInfo.id
}

BaseModule.prototype.setModuleName = function setModuleName(name) {
    this.moduleInfo.name = name
}

BaseModule.prototype.setModuleCredential = function setModuleCredential(username, password) {
    this.moduleInfo.userName = username;
    this.moduleInfo.password = password;
}

BaseModule.prototype.getModuleCredential = function getModuleCredential() {
    return{
        userName: this.moduleInfo.userName,
        password: this.moduleInfo.password
    }
}

BaseModule.prototype.setModuleUrl = function setModuleUrl(url) {
    this.moduleInfo.url = url;
}

BaseModule.prototype.getModuleUrl = function getModuleUrl() {
    return this.moduleInfo.url;
}

BaseModule.prototype.init = function init(readyCallback) {
    console.log("init the base module : " + this.moduleInfo.name);
    var self = this;
    Database().getSMSCenterByName(this.moduleInfo.name, null, function () {
        console.log("There is not any instance");
    }, function (name, userName, password, url, id, number) {
        self.moduleInfo.name = name;
        self.moduleInfo.userName = userName;
        self.moduleInfo.password = password;
        self.moduleInfo.url = url;
        self.moduleInfo.id = id;
        self.moduleInfo.number = number;
        console.log(self.moduleInfo);
        readyCallback && readyCallback();
    })
}

module.exports = BaseModule;