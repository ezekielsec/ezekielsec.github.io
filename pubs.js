const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = 6666;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple terminal-style web interface
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Command Executor</title>
    <style>
        body {
            background: black;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
        }
        #output {
            white-space: pre-wrap;
            margin-bottom: 20px;
            font-family: 'Courier New', monospace;
        }
        #command-line {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        #prompt {
            color: #00ff00;
            font-weight: bold;
        }
        #cmd {
            background: black;
            color: #00ff00;
            border: 1px solid #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            flex: 1;
            padding: 5px;
            outline: none;
        }
        button {
            background: black;
            color: #00ff00;
            border: 1px solid #00ff00;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            padding: 5px 15px;
        }
        button:hover {
            background: #00ff00;
            color: black;
        }
    </style>
</head>
<body>
<div>
    <div id="output">Welcome to Command Executor<br>Type any command and press Enter<br><br></div>
    <div id="command-line">
        <span id="prompt">$&nbsp;</span>
        <input type="text" id="cmd" autofocus>
        <button onclick="execute()">Run</button>
    </div>
</div>

<script>
    const outputDiv = document.getElementById('output');
    const cmdInput = document.getElementById('cmd');
    
    async function execute() {
        const cmd = cmdInput.value.trim();
        if (!cmd) return;
        
        outputDiv.innerHTML += '$ ' + cmd + '\\n';
        cmdInput.value = '';
        outputDiv.innerHTML += 'Executing...\\n';
        
        try {
            const response = await fetch('/exec?cmd=' + encodeURIComponent(cmd));
            const data = await response.json();
            
            if (data.stdout) outputDiv.innerHTML += data.stdout;
            if (data.stderr) outputDiv.innerHTML += data.stderr;
            if (data.error) outputDiv.innerHTML += 'Error: ' + data.error + '\\n';
            if (!data.stdout && !data.stderr && !data.error) outputDiv.innerHTML += '(no output)\\n';
            
            outputDiv.innerHTML += '\\n';
        } catch (err) {
            outputDiv.innerHTML += 'Error: ' + err.message + '\\n\\n';
        }
        
        outputDiv.scrollTop = outputDiv.scrollHeight;
    }
    
    cmdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') execute();
    });
</script>
</body>
</html>
    `);
});

// Command execution endpoint
app.get('/exec', (req, res) => {
    const command = req.query.cmd;
    
    if (!command) {
        return res.status(400).json({
            success: false,
            error: 'No command provided'
        });
    }
    
    console.log('[' + new Date().toISOString() + '] Executing: ' + command);
    
    exec(command, { 
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10,
        shell: '/bin/bash'
    }, (error, stdout, stderr) => {
        const response = {
            success: !error,
            command: command,
            stdout: stdout || '',
            stderr: stderr || '',
            error: error ? error.message : null
        };
        
        console.log('[' + new Date().toISOString() + '] Completed: ' + command);
        res.json(response);
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', port: PORT });
});

// Start server
app.listen(PORT, '0.0.0.0', function() {
    console.log('\n========================================');
    console.log('Terminal Command Executor');
    console.log('========================================');
    console.log('Port: ' + PORT);
    console.log('Web UI: http://localhost:' + PORT);
    console.log('API: http://localhost:' + PORT + '/exec?cmd=whoami');
    console.log('========================================\n');
});
