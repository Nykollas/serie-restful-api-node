const path = require('path');
const nodemailer = require('nodemailer');
const exphbs = require('express-handlebars');
const hbs = require('nodemailer-express-handlebars');

const { host, port, user, pass } = require('../config/mail.json');

const transport = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth:{user, pass},

});

const viewPath = path.resolve('./resources/mail/auth');

transport.use('compile', hbs({
    viewEngine:exphbs.create({
        layoutsDir:viewPath,
        partialsDir:viewPath,
        defaultLayout:'forgot_password',
        extname:'.html'

    }),
    viewPath,
    extName:'.html'
}));

module.exports = transport;