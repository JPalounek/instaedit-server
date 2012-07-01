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

/*
app.get('/save/:key/:value', function(req, res) {
	var params = req.route.params;

	Security.isRequestSafe(req, function (result) {
		if(result == true) {
			var data = {};
			data.key = params.key;
			data.val = params.value;

			Storage.save('storage', data, function (result) {
				res.send(result);
			});
		} else {
			res.send('Your request was identified as attack, stop it please.');
		}

		res.end;
	});
});

app.get('/load/:key', function(req, res) {
	var params = req.route.params;

	Security.isRequestSafe(req, function (result) {
		if(result == true) {
			Storage.load('storage', params.key, function (result) {
				res.send(result);
			});
		} else {
			res.send('Your request was identified as attack, stop it please.');
		}

		res.end;
	});
});
*/

app.get('/authenticate/:code', function(req, res) {
  console.log('authenticating code:' + req.params.code);
  Github.authenticate(req.params.code, function(err, token) {
  	res.send('<sript> window.opener.setGithubToken(token); window.close(); </script>');
  });
});

app.get('/login', function (req, res) {
	res.send('<a href="https://github.com/login/oauth/authorize?client_id=' + Github.loadConfig().oauth_client_id + '&redirect_uri=http://instaedit-server.herokuapp.com/oauth-redirect">Authenticate</a>');
	res.end();
});

app.get('/oauth-redirect', function (req, res) {
	console.log(req);
	res.redirect('/authenticate/' + req.params.code);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});