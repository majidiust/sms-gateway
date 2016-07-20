var express = require('express');
var jwt = require("jwt-simple");
var moment = require("moment");
var router = express.Router();
var applicationControl = require('./app');
var nodemailer = require('nodemailer');
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', 'templates');
var emailTemplates = require('email-templates');
var EmailAddressRequiredError = new Error('email address required');

var util =
{
    send_email : function (email, username, password ,templateName, to, subject, cc, body, fn)
    {
        if (!to)
        {
            return fn(EmailAddressRequiredError);
        }
        if (!subject)
        {
            return fn(EmailAddressRequiredError);
        }

        emailTemplates(templatesDir, function (err, template)
        {
            if (err)
            {
                return fn(err);
            }

            var locals = {
                from: email, to : to, subject: subject, cc: cc, text: body, username: username, password: password
            }

            template(templateName, locals, function (err, html, text)
            {
                if (err)
                {
                    return fn(err);
                }
                var transport = nodemailer.createTransport(({
                    service: 'gmail',
                    auth:
                    {
                        user: locals.username,
                        pass: locals.password
                    }
                }));

                transport.sendMail(
                    {
                        from: locals.email,
                        to: locals.to,
                        cc: locals.cc,
                        subject: locals.subject,
                        html: html,
                        text: text
                    },
                    function (err, responseStatus)
                    {
                        if (err)
                        {
                            return fn(err);
                        }
                        return fn(null, responseStatus.message);
                    }
                );
            });
        });
    }
}

function sendEmail(req, res) {
    try {
        var username = req.body.username;
        var password = req.body.password;
        var subject = req.body.subject;
        var cc = req.body.subject;
        var from = req.body.from;
        var to = req.body.to;
        var body = req.body.body;
        console.log(req.body);
        util.send_email(from, username, password, 'email/free',  to, subject, cc, body, console.log);
        res.send("ok", 200);
    }
    catch (ex) {
        res.send(ex, 500);
    }
}


router.route('/sendEMail').post(applicationControl.requireApplicationAuthentication, sendEmail);

module.exports = router;