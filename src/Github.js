var url   = require('url'),
    http  = require('http'),
    https = require('https'),
    fs    = require('fs'),
    app   = require('express').createServer(),
    qs    = require('querystring'),
    request = require('request'),
    GitHubApi = require("github");

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

Github.prototype.getParentTreeSha = function (target, cb) {
  var link = '/repos/' + target[0] + '/' + target[1] + '/git/refs/heads/' + target[2];

  var options = {
    host: 'api.github.com',
    method: 'GET',
    path: link
  };

  http.get(options, function(res) {
    var result = '';
    res.setEncoding('utf-8');

    res.on('data', function (chunk) {
      result += chunk;
    });

    res.on('end', function () {
      if(res.statusCode == 200) {
        console.log(res.responseText);
        cb(JSON.parse(res.responseText));
      } else {
        console.log(res.statusCode);
        cb(res.statusCode);
      }
    });

    res.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
  });

}

Github.prototype.commit = function (data, cb) {
  console.log('Commit!');

  var target = data.target.replace('https://raw.github.com/').split('/');

  var path = '';
  for (var i in target) {
    var key = parseInt(i) + 3;
    if(typeof target[key] != 'undefined') {
      path += target[key];
    }
  }

  var commitData = {};
  commitData.user = target[0].replace('undefined', '');
  commitData.repo = target[1];
  commitData.tree = data.tree;
  commitData.parents = data.parents;
  commitData.message = 'Changed ' + path.split('/')[path.split('/').length - 1] + ' - via Instaedit.';
  commitData.content = data.data;
  commitData.encoding = 'utf-8';

  console.log(commitData);

  var gh = new GitHubApi({
    version: "3.0.0"
  });

  console.log(data.token);
  gh.authenticate({
    type: "oauth",
    token: data.token
  });

  gh.user.get({}, function (err, data) {
    console.log(err);
    console.log(data);

    var blob = {};
    blob.repo = commitData.repo;
    blob.user = commitData.user;
    blob.content = commitData.content;
    blob.encoding = commitData.encoding;
  

    var gist = {};
    gist.description = commitData.message;
    gist.public = true;

    gist.files = {};
    gist.files[path.split('/')[path.split('/').length - 1]] = {};
    gist.files[path.split('/')[path.split('/').length - 1]].content = commitData.content;
    console.log(JSON.stringify(gist));
    
    gh.gitdata.createBlob(blob, function (err, blob) {
      console.log('--> error!');
      console.log(err);
      console.log('--> blob!');
      console.log(blob);
      cb('failed');
    });
    
  });
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