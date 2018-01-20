const express = require('express');
const nodemailer = require('nodemailer');

var app = express();

// set port
var port = process.env.PORT || 8080;

app.use(express.urlencoded({parse: 'application/x-www-form-urlencoded'})); // to support URL-encoded bodies
app.use(express.static(__dirname + '/public'));

// routes
app.get('/', function(req, res) {
  res.render('index');
});

function sendJSON(res, reply, errors, messages) {
  reply = reply || {};

  if (errors && propCount(errors)) {
    reply.errors = errors;
  }

  if (messages && messages.length) {
    reply.messages = messages;
  }

  res.setHeader('Content-Type', 'application/json');
  res.send( JSON.stringify( reply ) );
}

function propCount(obj) {
  var keys = Object.keys(obj);
  return (keys ? keys.length : 0);
}
function isEmpty(obj) {
  return !propCount(obj);
}

app.post('/contact', function(req, res) {
  var keys = Object.keys(req.body);
  var data = {};
  var errors = {};
  var messages = [];
  var reply = {};
  for (var i=0; i < keys.length; i++) {
    data[keys[i]] = req.body[keys[i]];
  }

  if (!data.email) {
    errors['email'] = 'We need an email address to stay in touch.';
  }
  else if (!Email.isValidEmail(data.email)) {
    errors['email'] = 'This can\'t be real... <em>(email address is invalid.)</em>';
  }
  if (!data.message) {
    errors['message'] = 'Nothing to say?';
  }

  if (isEmpty(errors)) {
    var sendTo = {
      email: 'info@technaturally.com',
      name: 'Technaturally Info'
    };
    var sendFrom = {
      email: data.email,
      name: data.name
    };

    var sendMessage = 'Quick Connect received on Technaturally.com\n\n';
    sendMessage += 'Name:    '+data.name+'\n';
    sendMessage += 'Email:   '+data.email+'\n';
    sendMessage += 'Message: '+data.message+'\n';

    Email.send(sendFrom, sendTo, sendMessage, 'Quick Connect on Technaturally.com', function(error, info) {
      if (error) {
        messages.push({msg: 'It didn\'t work. Are there gremlins in the pipes?', type: 'error'});
        reply.success = false;
      }
      else {
        messages.push({msg: 'Message sent!  We\'ll be in touch.  Thank you!', type: 'success'});
        reply.success = true;
      }
      sendJSON(res, reply, errors, messages);
    });
    return;
  }
  else {
    errors['form'] = (propCount(errors) == 1 ? 
    'There\'s something wrong with the input.' :
    'There are some things wrong with the input.');
  }

  sendJSON(res, reply, errors, messages);
});

app.listen(port, function() {
  console.log('Technaturally.com running...');
});

var Email = {
  // source: http://emailregex.com/
  EMAIL_RX: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  SENDER: '"Quick Connect" <info@technaturally.com>',
  transporter: null,
  isValidEmail: function(email) {
    return this.EMAIL_RX.test(email);
  },
  isValidContact: function(contact) {
    if (typeof contact === 'string') {
      if (this.isValidEmail(contact)) {
        return true;
      }
      var email_rx_str = this.EMAIL_RX.toString();
      var contact_rx = new RegExp('^"[^"]*" ?<'+email_rx_str.substring(2, email_rx_str.length-2)+'>$');
      return contact_rx.test(contact);
    }
    return false;
  },
  contactString: function(contact) {
    var result = '';
    if (Array.isArray(contact)) {
      for (var i=0; i < contact.length; i++) {
        result += (result ? ', ' : '') + contactString(contact[i]);
      }
    }
    else if (typeof contact === 'string') {
      result = contact;
    }
    else if (typeof contact == 'object') {
      if (contact.email) {
        if (contact.name) {
          result = '"'+contact.name+'" <'+contact.email+'>';
        }
        else {
          result = contact.email;
        }
      }
    }
    return (this.isValidContact(result) ? result : '');
  },
  assertTransporter: function() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
          host: '',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
              user: '',
              pass: ''
          }
      });
    }
    return this.transporter;
  },
  send: function(fromContact, toContact, message, subject, callback) {
    var emailConfig = {
      from: this.contactString(this.SENDER),
      replyTo: this.contactString(fromContact),
      to: this.contactString(toContact),
      subject: subject,
      text: message
    };

    if (this.assertTransporter()) {
      this.transporter.sendMail(emailConfig, callback);
    }
    return true;
  }
};
