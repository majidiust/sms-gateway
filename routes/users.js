var express = require('express');
var userModel = require("../database/model/user").UserModel;
var tokenModel = require("../database/model/token").TokenModel;
var jwt = require("jwt-simple");
var moment = require("moment");
var datejs = require("safe_datejs");
var jalali_moment = require("moment-jalaali");
var router = express.Router();


var requireAuthentication = function (req, res, next) {
    if (req.headers.token != undefined) {
        var decoded = jwt.decode(req.headers.token, "729183456258456");
        if (decoded.exp <= Date.now) {
            res.send("Access token has expired", 400);
        }
        userModel.findOne({ '_id': decoded.iss }, function (err, user) {
            if (!user) {
                res.send("Not found", 401);
            }
            else if (!err) {
                tokenModel.find({ token: req.headers.token, state: true, userId: user.id }, function (err, tokens) {
                    if (tokens.length > 0) {
                        req.user = user;
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

function disableOtherAccounts(userId) {
    var today = new Date();
    var conditions = { userId: userId }
        , update = { stete: true, deleted: today.AsDateJs() }
        , options = { multi: true };
    tokenModel.update(conditions, update, options, function (err, numAffected) {
        if (err)
            console.log(err);
        else {
            console.log("Number of updated is : " + numAffected);
        }
    });
}

function updateUserActivity(activity, user) {
    user.activities.push({ activityname: activity, activitydate: (new Date()).AsDateJs() });
    user.save(null);
}

function signout(req, res) {
    tokenModel.findOne({ token: req.headers.token, userId: req.user.userId }, function (err, token) {
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
    var userName = req.body.username;
    var password = req.body.password;
console.log(userName + " : " + password);
    userModel.findOne({ username: userName }, function (err, user) {
        if (err) {
            console.log(err);
            res.send("Authentication error: error in fetching data", 401);
            return;
        }
        else {
            if (!user) {
                console.log("user " + userName + " not found");
                res.send("Authentic ation error : user not found", 401);
                return;
            }
            else {
                user.verifyPassword(password, function (err, isMatch) {
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
                        else if (user.username != 'admin' && user.isaproved == false) {
                            console.log("user has been disabled");
                            res.send("user has been disabled", 403);
                        }
                        else {
                            console.log("disabling other tokens for user  : " + userName);
                            updateUserActivity("ورود به سیستم", user);
                            disableOtherAccounts(user.id);
                            console.log("alocationg new token for user  : " + userName);
                            var expires = moment().add('days', 7).valueOf();
                            var token = jwt.encode({
                                    iss: user.id,
                                    exp: expires
                                },
                                "729183456258456"
                            );
                            var newTokenIns = new tokenModel({
                                userId: user.id,
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

                                var result = user.getSummery();
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
    console.log("Signup new user");
    var user = new userModel({
        username: req.body.username,
        hashedpassword: req.body.password,
        firstname: req.body.firstName,
        lastname: req.body.lastName,
        gender: req.body.gender,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        salt: "1",
        isaproved: false,
        islockedout: false
    });
    console.log(user);
    user.roles.push({ rolename: 'user' });
    user.activities.push({ activityname: 'ثبت نام', activitydate: (new Date()).AsDateJs() });
    user.save(function (err) {
        if (err)
            res.send(err, 401);
        else
            res.json({message: 'user added to database successfully', userId: user.id});
    });
}


function signupAdmin(req, res) {
    console.log("Signup new user");
    var user = new userModel({
        username: req.body.username,
        hashedpassword: req.body.password,
        firstname: req.body.firstName,
        lastname: req.body.lastName,
        gender: req.body.gender,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        salt: "1",
        isaproved: false,
        islockedout: false
    });
    console.log(user);
    user.roles.push({ rolename: 'admin' });
    user.activities.push({ activityname: 'ثبت نام', activitydate: (new Date()).AsDateJs() });
    user.save(function (err) {
        if (err)
            res.send(err, 401);
        else
            res.json({message: 'user added to database successfully', userId: user.id});
    });
}

function getUserList(req, res) {

    //save activities
    updateUserActivity("مشاهده لیست کاربران", req.user);
    userModel.find(function (err, users) {
        if (err)
            res.send(err, 401);
        else {

            res.json(users);
        }
    });
}

function getUser(req, res) {
    updateUserActivity("دریافت کاربر یا ایمیل", req.user);
    console.log("Get user by email : " + req.params.email);
    if (req.params.email) {
        userModel.findOne({ email: req.params.email }, function (err, user) {
            res.json(user.getBrief());
        });
    }
}

function getUserById(req, res) {
    updateUserActivity("دریافت کاربر با شناسه", req.user);
    console.log("Get user by id : " + req.body.userId);
    if (req.body.userId) {
        userModel.findOne({'_id': req.body.userId }, function (err, user) {
            res.json(user.getBrief());
        });
    }
}


function getCurrentUser(req, res) {
    updateUserActivity("دریافت اطلاعات کاربر فعلی", req.user);
    console.log("get current user : " + req.user.email);
    return res.json(req.user.getBrief());
}

function addRoleToUser(req, res) {
    try {
        updateUserActivity("افزودن نقش به کاربر", req.user);
        userModel.findOne({ '_id': req.body.userId }, function (err, user) {
            if (user) {
                var find = false;
                for (var i = 0; i < user.roles.length; i++) {
                    if (user.roles[i].rolename == req.body.rolename) {
                        find = true;
                        break;
                    }
                }
                if (find == false)
                    user.roles.push({rolename: req.body.rolename});
                res.send("ok");
                user.save(null);
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

function changeUserStatus(req, res) {

    try {
        userModel.findOne({ '_id': req.body.userId }, function (err, user) {
            if (user) {
                user.isaproved = Boolean(!user.isaproved);
                user.save(null);
                updateUserActivity("تغییر وضعیت کاربر : " + req.body.userId + " : " + user.isaproved, req.user);
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

function getUserActivity(req, res) {
    try {
        var pageNumber = req.params.page;
        var pageSize = req.params.pageSize;
        var userId = req.params.userId;
        console.log(pageNumber + " : " + pageSize + " : " + userId);
        userModel.findOne({'_id': userId}).exec(function (error, users) {
            if (error) {
                res.send(error, 500);
            }
            if (users) {
                var result = [];
                //var ii = pageSize;
                //if(pageSize >= user.activities.length)
                //{
                //    ii = user.activities.length;
                //}
                for (var i = pageSize - 1; i >= 1; i--) {
                    if (pageNumber * pageSize + i < users.activities.length) {
                        var dd = users.activities[i + pageNumber * pageSize];
                        console.log((i + pageNumber * pageSize));
//			console.log(dd.activitydate);
                        dd.activitydate.setHours(dd.activitydate.getHours() + 3);
                        dd.activitydate.setMinutes(dd.activitydate.getMinutes() + 30);
                        console.log(dd.activitydate);
                        var ss = dd.activitydate.toISOString().replace('T', ' ');
                        console.log(ss);
                        var ddd = jalali_moment(ss, 'YYYY-M-D HH:mm:ss').format('jYYYY/jM/jD HH:mm:ss'); // 1392/6/31 23:59:59
//			ddd.add(3, "hour");
//			ddd.add(30, "minutes");
                        console.log(ddd);
                        dd.activitydate = ddd;
                        result.push({_id: dd.id, activityname: dd.activityname, activitydate: ddd});
                    }
//		    else break;
                }
                res.json(result);
            }
        });
    }
    catch (ex) {
        console.log(ex);
        res.send(ex, 500);
    }
}

function getUserActivityCount(req, res) {
    try {
        var userId = req.params.userId;
        userModel.findOne({'_id': userId}, function (err, user) {
            var count = user.activities.length;
            console.log(count);
            res.json({count: count});
        });
    }
    catch (ex) {
        console.log(ex);
        lres.send(ex, 500);
    }
}

function changePassword(req, res) {
    try {
        if (req.body.password) {
            req.user.verifyPassword(req.body.currentPassword, function (err, isMatch) {
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
                        req.user.hashedpassword = req.body.password;
                        req.user.save(null);
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

function changeUserPassword(req, res) {
    try {
        if (req.body.password) {
            userModel.findOne({'_id': req.body.userId}).exec(function (err, user) {
                if (err) {
                    console.log(err);
                    res.send(err, 500);
                }
                else if (user) {
                    user.hashedpassword = req.body.password;
                    user.save(null);
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


router.route('/signout').post(requireAuthentication, signout);
router.route('/signin').post(signin);
router.route('/signup').post(signup);
router.route('/signupAdmin').post(signupAdmin);
router.route('/changePassword').post(requireAuthentication, changePassword);
router.route('/changeUserPassword').post(requireAuthentication, changeUserPassword);
router.route('/userList').get(requireAuthentication, getUserList);
router.route('/getUserByMail/:email').get(requireAuthentication, getUser);
router.route('/getUserById').post(requireAuthentication, getUserById);
router.route('/getCurrentUser').get(requireAuthentication, getCurrentUser);
router.route('/addRoleToUser').post(requireAuthentication, addRoleToUser);
router.route('/changeUserStatus').post(requireAuthentication, changeUserStatus);
router.route('/getUserActivity/:page/:pageSize/:userId').get(getUserActivity);
router.route('/getUserActivityCount/:userId').get(getUserActivityCount);

module.exports = router;
module.exports.requireAuthentication = requireAuthentication;
module.exports.updateUserActivity = updateUserActivity;