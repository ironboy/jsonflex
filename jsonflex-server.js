const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
require('./jsonflex.js');

module.exports = (options) => {

  let once, defaults = {
    scriptUrl: '/jsonflex.js',
    saveUrl: '/json-save',
    jsonDir: '/www/json'
  };
  options = Object.assign({}, defaults, options);
  options.jsonDir = path.join(__dirname, path.normalize(options.jsonDir));

  JSON._save = function(fileName, obj, replacer, space = '  '){
    fileName += fileName.substr(-5) != '.json' ? '.json' : '';
    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(options.jsonDir, fileName),
        JSON._stringify(obj, replacer, space),
        'utf8',
        (err) => {
          err ? reject(err) : resolve({done:!err});
        }
      );
    });
  }

  JSON._load = function(fileName, reviver){
    fileName += fileName.substr(-5) != '.json' ? '.json' : '';
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(options.jsonDir, fileName),(err,data)=>{
        err ? reject(err) : resolve(JSON._parse(data,reviver));
      });
    });
  }

  let script = fs.readFileSync(path.join(__dirname,'jsonflex.js'), 'utf8');
  script = script.split('/json-save').join(options.saveUrl);

  function serveScript(req, res){
    res.header('content-type','application/javascript; charset=utf-8');
    res.end(script);
  }

  function saver(req, res){
    let fileName = req.body.fileName;
    fileName += fileName.substr(-5) != '.json' ? '.json' : '';
    fs.writeFile(
      options.jsonDir + '/' + fileName,
      req.body.json,
      'utf8',
      (err) => {
        res.status(err ? 500 : 200);
        res.json({done:!err});
      }
    );
  }

  return (req, res, next) => {
    if(once){ next(); return; }
    req.app.post(options.saveUrl, saver);
    req.app.get(options.scriptUrl, serveScript);
    once = true;
    next();
  }

};
