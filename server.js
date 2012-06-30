var express = require('express');
var fs = require('fs');
var http = require('http');
var Storage = require('./src/Storage.js');
var Security = require('./src/Security.js');

var app = express.createServer();

Security = new Security();
Storage = new Storage();

app.get('/', function(req, res) {
	res.send('Simple-db is simple key value storage with friendly API, using JSON storage file and nodejs.');
	res.end;
});

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

var url   = require('url'),
    http  = require('http'),
    https = require('https'),
    fs    = require('fs'),
    app   = require('express').createServer(),
    qs    = require('querystring');

// Load config defaults from JSON file.
// Environment variables override defaults.
function loadConfig() {
  var config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));
  for (var i in config) {
    config[i] = process.env[i.toUpperCase()] || config[i];
  }
  console.log('Configuration');
  console.log(config);
  return config;
}

var config = loadConfig();

function authenticate(code, cb) {
  var data = qs.stringify({
    client_id: config.oauth_client_id,
    client_secret: config.oauth_client_secret,
    code: code
  });

  var reqOptions = {
    host: config.oauth_host,
    port: config.oauth_port,
    path: config.oauth_path,
    method: config.oauth_method,
    headers: { 'content-length': data.length }
  };

  var body = "";
  var req = https.request(reqOptions, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function() {
      cb(null, qs.parse(body).access_token);
    });
  });

  req.write(data);
  req.end();
  req.on('error', function(e) { cb(e.message); });
}


// Convenience for allowing CORS on routes - GET only
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS'); 
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


app.get('/authenticate/:code', function(req, res) {
  console.log('authenticating code:' + req.params.code);
  authenticate(req.params.code, function(err, token) {
    var result = err || !token ? {"error": "bad_code"} : { "token": token };
    console.log(result);
    res.json(result);
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});