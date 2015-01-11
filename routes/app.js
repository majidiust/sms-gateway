var express = require('express');
var applicationModel = require("../database/model/application").ApplicationModel;
var tokenModel = require("../database/model/token").TokenModel;
var jwt = require("jwt-simple");
var moment = require("moment");
var datejs = require("safe_datejs");
var jalali_moment = require("moment-jalaali");
var router = express.Router();


var requireApplicationAuthentication = function (req, res, next) {
    console.log("try to authenticate");
    if (req.headers.token != undefined) {
        var decoded = jwt.decode(req.headers.token, "729183456258456");
        if (decoded.exp <= Date.now) {
            res.send("Access token has expired", 400);
        }
        applicationModel.findOne({ '_id': decoded.iss }, function (err, application) {
            if (!application) {
                res.send("Not found", 401);
            }
            else if (!err) {
                tokenModel.find({ token: req.headers.token, state: true, userId: application.id }, function (err, tokens) {
                    if (tokens.length > 0) {
                        req.application = application;
                        return next();
                    }
                    else {
                        res.send("Not authorized", 401);
                    }
                })
            }
            else {
                res.send("Not authorized", 401);
            }
        });
    }
    else {
        res.send("Not authorized", 401);
    }
}

function disableOtherAccounts(applicationId) {
    var today = new Date();
    var conditions = { userId: applicationId }
        , update = { state: true, deleted: today.AsDateJs() }
        , options = { multi: true };
    tokenModel.update(conditions, update, options, function (err, numAffected) {
        if (err)
            console.log(err);
        else {
            console.log("Number of updated is : " + numAffected);
        }
    });
}

function signout(req, res) {
    tokenModel.findOne({ token: req.headers.token, userId: req.application.userId }, function (err, token) {
        if (err) {
            return next(err);
        }
        else {
            token.state = false;
            token.save(function (err) {
                if (err)
                    return next(err);
                else {
                    res.json({ state: true });
                }
                console.log("token updated successfully");
            });
        }
    });
}

function signin(req, res) {
    var appId = req.body.appId;
    var password = req.body.password;
    applicationModel.findOne({ '_id': appId }, function (err, application) {
        if (err) {
            console.log(err);
            res.send("Authentication error: error in fetching data", 401);
            return;
        }
        else {
            if (!application) {
                console.log("application " + appId + " not found");
                res.send("Authentic action error : application not found", 401);
                return;
            }
            else {
                application.verifyPassword(password, function (err, isMatch) {
                    if (err) {
                        console.log(err);
                        res.send("Authentication error: error in verify password", 401);
                        return;
                    }
                    else {
                        if (!isMatch) {
                            console.log("Authentication error : password is wrong");
                            res.send("Authentication error : password is wrong", 401);
                        }
                        else if (application.name != 'admin' && application.approved == false) {
                            console.log("application has been disabled");
                            res.send("application has been disabled", 403);
                        }
                        else {
                            console.log("disabling other tokens for application  : " + appId);
                            disableOtherAccounts(appId);
                            console.log("alocationg new token for application  : " + appId);
                            var expires = moment().add('days', 7).valueOf();
                            var token = jwt.encode({
                                    iss: appId,
                                    exp: expires
                                },
                                "729183456258456"
                            );
                            var newTokenIns = new tokenModel({
                                userId: appId,
                                token: token,
                                exp: expires
                            });
                            newTokenIns.save(function (err) {
                                if (err) {
                                    console.log("Error in saveing token in database : " + err);
                                }
                                else {
                                    console.log("Token saved successfully");
                                }

                                var result = application.getBrief();
                                result["token"] = token;
                                res.json(result);
                                return;
                            });
                        }
                    }
                });
            }
        }
    });
}

function signup(req, res) {
    console.log("Signup new application");
    var application = new applicationModel({
        hashedPassword: req.body.password,
        registerDate: (new Date()).AsDateJs(),
        name: req.body.name,
        email: req.body.email,
        approved: true,
        locked: false,
        phone: req.body.phone,
        salt: "1"
    });
    console.log(application);
    application.roles.push({ roleName: 'user' });
    application.save(function (err) {
        if (err)
            res.send(err, 401);
        else
            res.json({message: 'application added to database successfully', appId: application.id});
    });
}


function signupAdmin(req, res) {
  console.log("Signup new application");
      var application = new applicationModel({
          hashedPassword: req.body.password,
          registerDate: (new Date()).AsDateJs(),
          name: req.body.name,
          email: req.body.email,
          approved: false,
          locked: false,
          phone: req.body.phone,
          salt: "1",
      });
      console.log(application);
      application.roles.push({ roleName: 'admin' });
      application.save(function (err) {
          if (err)
              res.send(err, 401);
          else
              res.json({message: 'application added to database successfully', appId: application.id});
      });
}

function getApplicationList(req, res) {
    applicationModel.find(function (err, apps) {
        if (err)
            res.send(err, 401);
        else {
            var result = [];
            apps.forEach(function(tmpApp){
                result.push(tmpApp.getBrief());
            });
            res.json(result);
        }
    });
}

function getApplication(req, res) {
    console.log("Get user by email : " + req.params.email);
    if (req.params.email) {
        applicationModel.findOne({ email: req.params.email }, function (err, application) {
            res.json(application.getBrief());
        });
    }
}

function getApplicationById(req, res) {
    if (req.body.appId) {
        applicationModel.findOne({'_id': req.body.appId }, function (err, application) {
            res.json(application.getBrief());
        });
    }
}

function getCurrentApplication(req, res) {
    return res.json(req.application.getBrief());
}

function addRoleToApplication(req, res) {
    try {
        applicationModel.findOne({ '_id': req.body.appId }, function (err, application) {
            if (application) {
                var find = false;
                for (var i = 0; i < application.roles.length; i++) {
                    if (application.roles[i].roleName == req.body.roleName) {
                        find = true;
                        break;
                    }
                }
                if (find == false)
                    application.roles.push({roleName: req.body.roleName});
                res.send("ok");
                application.save(null);
            }
            else
                res.send('not found', 404);
        });
    }
    catch (ex) {
        console.log(ex);
        res.send(ex, 500);
    }
}

function changeApplicationStatus(req, res) {

    try {
        applicationModel.findOne({ '_id': req.body.appId }, function (err, application) {
            if (application) {
                application.approved = Boolean(!application.approved);
                approved.save(null);
                res.send("ok");
            }
            else {
                res.send("not found", 406);
            }
        });
    }
    catch (ex) {
        console.log(ex);
        res.send(ex, 500);
    }
}

function changePassword(req, res) {
    try {
        if (req.body.password) {
            req.application.verifyPassword(req.body.currentPassword, function (err, isMatch) {
                if (err) {
                    console.log(err);
                    res.send("Authentication error: error in verify password", 401);
                    return;
                }
                else {
                    if (!isMatch) {
                        console.log("Authentication error : password is wrong");
                        res.send("Authentication error : password is wrong", 401);
                    }
                    else {
                        req.application.hashedPassword = req.body.password;
                        req.application.save(null);
                        res.send("save successfully");
                    }
                }
            });
        }
    }
    catch (ex) {
        console.log(ex);
        res.send(ex, 500);
    }
}

function changeApplicationPassword(req, res) {
    try {
        if (req.body.password) {
            applicationModel.findOne({'_id': req.body.appId}).exec(function (err, application) {
                if (err) {
                    console.log(err);
                    res.send(err, 500);
                }
                else if (user) {
                    application.hashedPassword = req.body.password;
                    application.save(null);
                    res.send("save successfully");
                }
            });
        }
    }
    catch (ex) {
        console.log(ex);
        res.send(ex, 500);
    }
}

/*
 *   Register user apis
 */

router.route('/signout').post(requireApplicationAuthentication, signout);
router.route('/signin').post(signin);
router.route('/signup').post(signup);
router.route('/signupAdmin').post(signupAdmin);
router.route('/changePassword').post(requireApplicationAuthentication, changePassword);
router.route('/changeApplicationPassword').post(requireApplicationAuthentication, changeApplicationPassword);
router.route('/getApplicationList').get(requireApplicationAuthentication, getApplicationList);
router.route('/getApplicationByMail/:email').get(requireApplicationAuthentication, getApplication);
router.route('/getApplicationById').post(requireApplicationAuthentication, getApplicationById);
router.route('/getCurrentApplication').get(requireApplicationAuthentication, getCurrentApplication);
router.route('/addRoleToApplication').post(requireApplicationAuthentication, addRoleToApplication);
router.route('/changeApplicationStatus').post(requireApplicationAuthentication, changeApplicationStatus);

module.exports = router;
module.exports.requireApplicationAuthentication = requireApplicationAuthentication;
