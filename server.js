var express = require('express');
var app = express();

// set port
var port = process.env.PORT || 8080;

app.use(express.urlencoded({parse: 'application/x-www-form-urlencoded'})); // to support URL-encoded bodies
app.use(express.static(__dirname + '/public'));

// routes
app.get('/', function(req, res) {
  res.render('index');
});

app.post('/contact', function(req, res) {
  var keys = Object.keys(req.body);
  var data = {};
  for (var i=0; i < keys.length; i++) {
    data[keys[i]] = req.body[keys[i]];
  }
  
  res.send('Hello '+data.name);
});

app.listen(port, function() {
  console.log('Technaturally.com running...');
});
