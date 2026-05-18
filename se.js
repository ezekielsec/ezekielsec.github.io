const http = require('http');
const { exec } = require('child_process');
const url = require('url');

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
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Command Panel</title>
</head>
<body>
  <input type="text" id="cmd" placeholder="Enter command" style="width: 300px;">
  <button onclick="runCommand()">Execute</button>
  <pre id="result"></pre>

  <script>
    function runCommand() {
      const cmd = document.getElementById('cmd').value;
      const resultDiv = document.getElementById('result');
      
      if (!cmd) {
        resultDiv.innerText = 'Please enter a command';
        return;
      }
      
      resultDiv.innerText = 'Executing...';
      
      fetch('/api/cmd?cmd=' + encodeURIComponent(cmd))
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            resultDiv.innerText = 'Error: ' + data.error;
          } else {
            resultDiv.innerText = data.output || '(no output)';
          }
        })
        .catch(err => {
          resultDiv.innerText = 'Request failed: ' + err.message;
        });
    }
  </script>
</body>
</html>
    `);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});