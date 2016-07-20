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
    send_email : function (email, username, password ,templateName, to, subject, cc, fn)
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

            template(templateName, to, subject, cc, function (err, html, text)
            {
                if (err)
                {
                    return fn(err);
                }
                var transport = nodemailer.createTransport(({
                    service: 'gmail',
                    auth:
                    {
                        user: username,
                        pass: password
                    }
                }));

                transport.sendMail(
                    {
                        from: email,
                        to: to,
                        cc: cc,
                        subject: subject,
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
        var name = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var subject = req.body.subject;
        var cc = req.body.subject;
        var from = req.body.from;
        var to = req.body.to;
        util.send_email(from, username, password, 'email/free',  to, subject, console.log);
    }
    catch (ex) {
        res.send(ex, 500);
    }
}


router.route('/sendEMail').post(applicationControl.requireApplicationAuthentication, sendEmail);

module.exports = router;