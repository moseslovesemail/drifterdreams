const http = require('http');
const fs = require('fs');
const path = require('path');
const port = Number(process.env.PORT || 3000);
const root = path.join(__dirname, 'public');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};

http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'content-type':'application/json; charset=utf-8'});
    return res.end(JSON.stringify({ok:true, product:'Drifter Good Dog Club'}));
  }
  const clean = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  let full = path.normalize(path.join(root, file));
  if (!full.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(full, (err, stat) => {
    if (err || !stat.isFile()) full = path.join(root, 'index.html');
    fs.readFile(full, (readErr, data) => {
      if (readErr) { res.writeHead(500); return res.end('Server error'); }
      res.writeHead(200, {'content-type': types[path.extname(full)] || 'application/octet-stream'});
      res.end(data);
    });
  });
}).listen(port, '0.0.0.0', () => console.log(`Drifter Good Dog Club listening on ${port}`));
