var express = require('express');
var fs = require('fs');
var http = require('http');

var Storage = require('./src/Storage.js');
var Security = require('./src/Security.js');
var Github = require('./src/Github.js');

var app = express.createServer();

Security = new Security();
Storage = new Storage();
Github = new Github();

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS'); 
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', function(req, res) {
	res.send('Instaedit github auth server.');
	res.end;
});

app.get('/getcode', function(req, res) {
  	Security.isRequestSafe(req, function (result) {
		if(result == true) {
			Storage.load('storage', req.headers['x-forwarded-for'], function (result) {
				if(result != 'failed') {
					res.send('{"result": "found", "token": "' + result + '"}');
				} else {
					res.send('{"result": "not found"}');
				}
			});
		} else {
			res.send('Your request was identified as attack, stop it please.');
		}

		res.end;
	});
});

app.get('/done', function(req, res) {
	res.send('Close this window now and wait few seconds when Instaedit editor will get info that you signed to github.');
	res.end();
});

app.get('/authenticate/:code', function(req, res) {
  Github.authenticate(req.params.code, function(err, token) {
	Security.isRequestSafe(req, function (result) {
		if(result == true) {
			console.log(req);
			console.log(req.headers);
			var data = {};
			data.key = req.headers['x-forwarded-for'];
			data.val = token;

			Storage.save('storage', data, function (result) {
				res.redirect('/done')
			});
		} else {
			res.send('Your request was identified as attack, stop it please.');
		}

		res.end;
	});
  });
});

app.get('/login', function (req, res) {
	res.send('<a href="https://github.com/login/oauth/authorize?client_id=' + Github.loadConfig().oauth_client_id + '&redirect_uri=http://instaedit-server.herokuapp.com/oauth-redirect">Authenticate</a>');
	res.end();
});

app.get('/oauth-redirect', function (req, res) {
	res.redirect('/authenticate/' + req.query["code"]);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});