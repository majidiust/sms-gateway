/**
 * New node file
 */
var mongoose = require('mongoose');

var InboxSchema = new mongoose.Schema({
    providerId: {type:String},
    body: {type: String},
    rcvDate: {type: String},
    from: {type: String}
});

var OutboxSchema = new mongoose.Schema({
    providerId: {type:String},
    body: {type: String},
    sendDate: {type: String},
    from: {type: String},
    to: {type: String},
    status: {type: Boolean}
});

var SMSCenterSchema = new mongoose.Schema({
    name: {type: String},
    username: {type: String},
    password: {type: String},
    url: {type: String},
    balance: {type: String},
    createDate: {type: Date},
    number: {type: String},
    status: {type: Boolean, default: true}
});

var InboxModel = mongoose.model('inbox', InboxSchema);
var OutboxModel = mongoose.model('outbox', OutboxSchema);
var SMSCenterModel =  mongoose.model('smsCenter', SMSCenterSchema);

module.exports.InboxModel = InboxModel;
module.exports.OutboxModel = OutboxModel;
module.exports.SMSCenterModel = SMSCenterModel;