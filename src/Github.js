var url   = require('url'),
    http  = require('http'),
    https = require('https'),
    fs    = require('fs'),
    app   = require('express').createServer(),
    qs    = require('querystring');

var Github = function () {};

// Load config defaults from JSON file.
// Environment variables override defaults.
Github.prototype.loadConfig = function() {
  var config = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf-8'));
  for (var i in config) {
    config[i] = process.env[i.toUpperCase()] || config[i];
  }

  return config;
}

Github.prototype.authenticate = function (code, cb) {
  var config = this.loadConfig();
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

module.exports = Github;