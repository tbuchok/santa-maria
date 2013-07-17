var http = require('http')
  , url = require('url')
  , db = require('levelup')('./db', { valueEncoding: 'json' })
  , updater = require('level-updater', { valueEncoding: 'json' })
  , PORT = process.env.PORT || 3000
;

db.inc = updater(db, function(a, b) { return (a | 0) + b; });

var createKey = function(key, id, type, date) {
  var _d = (date) ? new Date(date) : new Date(); 
  var d = _d.toISOString().split('T')[0];
  return "\xFF" + key + "\x00" + id + "\x00" + type + "\x00" + d;
}

var handleHit = function(req, res) {
  if (req.query['t'] === undefined || 
      req.query['c'] === undefined ||
      req.query['p'] === undefined  ) 
    return res.end('Not OK!'); // Do not add any `undefined` data, return early;

  var c = createKey('c', req.query['c'], req.query['t']);
  db.inc(c, 1);
  var p = createKey('p', req.query['p'], req.query['t']);
  db.inc(p, 1);

  res.end('OK!');
};

var handleData = function(req, res) {
  var start = createKey(req.query['key'], req.query['id'], req.query['t']);
  console.log(start);
  var total = 0;
  db.createReadStream({ start: start, values: true, keys: false })
    .on('error', function(err) { res.err(err) })
    .on('data', function(data) { total += data })
    .on('end', function() { res.end(total.toString()) })
  ;
  // res.end('Promise there is data!');
};

http.createServer(function(req, res) {
  req.query =  url.parse(req.url, true).query;
  if (/^\/\?/.test(req.url)) handleHit(req, res);
  if (/^\/data\/\?/.test(req.url)) handleData(req, res);
  else res.end('Not implented :(')
}).listen(PORT);
console.log('Listening on %s', PORT);