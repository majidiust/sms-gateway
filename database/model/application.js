/**
 * New node file
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var datejs = require('safe_datejs');
var Schema = mongoose.Schema;
//Define our user schema

var AppRole = new Schema({
    roleName: {type: String},
    roleDesc: String
});

var Application = new Schema({
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    registerDate: {type: String},
    roles: [AppRole],
    name: String,
    email: String,
    approved: Boolean,
    locked: Boolean,
    wallPaperPhoto: String,
    phone: String
});


Application.pre('save', function (callback) {
    var application = this;
    if (!application.isModified('hashedPassword')) return callback();
    else {
        bcrypt.genSalt(5, function (err, salt) {
            if (err)
                return callback(err);
            else {
                bcrypt.hash(application.hashedPassword, salt, null, function (err, hash) {
                    if (err)
                        return callback(err);
                    else{
                        application.hashedPassword = hash;
                        application.salt = salt;
                        callback();
                    }
                });
            }
        });
    }
});

Application.methods.verifyPassword = function (password, cb) {
    bcrypt.compare(password, this.hashedPassword, function (err, isMatch) {
        if (err)
            return cb(err);
        else {
            cb(null, isMatch);
        }
    });
}

Application.methods.getBrief = function () {
    var result = {
        id: this.id,
        email: this.email,
        name: this.name,
        phone: this.phone,
        roles: this.roles
    };
    return result;
}

Application.virtual('appId')
    .get(function () {
        return this.id;
    });

var ApplicationModel = mongoose.model('Application', Application);
module.exports.ApplicationModel = ApplicationModel;