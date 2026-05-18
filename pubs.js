#!/usr/bin/env node

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 6666;

// ============================================
// MIDDLEWARE - Essential for public server
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for public access (allows any domain to call your API)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// ============================================
// API ENDPOINTS - NO COMMAND BLOCKING
// ============================================

// Root endpoint - HTML interface
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Command Executor - Development API</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Courier New', monospace;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 { font-size: 2em; margin-bottom: 10px; }
                .header p { opacity: 0.9; }
                .content { padding: 30px; }
                .input-group {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                #command {
                    flex: 1;
                    padding: 15px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    background: #f9f9f9;
                }
                button {
                    padding: 15px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s;
                }
                button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
                .output {
                    background: #1e1e1e;
                    color: #d4d4d4;
                    padding: 20px;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    overflow-x: auto;
                    min-height: 400px;
                    white-space: pre-wrap;
                }
                .status {
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    margin-bottom: 15px;
                }
                .online { background: #27ae60; color: white; }
                .info {
                    background: #e8f4fd;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    border-left: 4px solid #3498db;
                }
                .example-cmds {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
                .example {
                    background: #ecf0f1;
                    padding: 5px 12px;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }
                .example:hover { background: #667eea; color: white; }
                @media (max-width: 768px) {
                    .input-group { flex-direction: column; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💻 Command Executor API</h1>
                    <p>Full system command execution for app development</p>
                </div>
                <div class="content">
                    <div class="info">
                        <strong>📡 API Endpoint:</strong> GET/POST /exec?cmd=your_command<br>
                        <strong>🔧 Port:</strong> 6666 | <strong>🚫 No command restrictions</strong><br>
                        <strong>⚠️ Note:</strong> For development use only - full system access enabled
                    </div>
                    
                    <div class="input-group">
                        <input type="text" id="command" placeholder="Enter any command (e.g., whoami, ls -la, pwd, cat /etc/passwd)" />
                        <button onclick="executeCommand()">Execute 🚀</button>
                        <button onclick="clearOutput()">Clear 🧹</button>
                    </div>
                    
                    <div class="example-cmds">
                        <strong>Quick examples:</strong>
                        <div class="example" onclick="setCommand('whoami')">whoami</div>
                        <div class="example" onclick="setCommand('pwd')">pwd</div>
                        <div class="example" onclick="setCommand('ls -la')">ls -la</div>
                        <div class="example" onclick="setCommand('date')">date</div>
                        <div class="example" onclick="setCommand('uptime')">uptime</div>
                        <div class="example" onclick="setCommand('ps aux')">ps aux</div>
                        <div class="example" onclick="setCommand('df -h')">df -h</div>
                        <div class="example" onclick="setCommand('free -h')">free -h</div>
                        <div class="example" onclick="setCommand('echo $PATH')">echo $PATH</div>
                        <div class="example" onclick="setCommand('ifconfig')">ifconfig</div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div class="status online" id="status">🟢 API Online - Port 6666</div>
                        <div class="output" id="output">Ready to execute commands...<br><br>Try: whoami, ls -la, or any system command<br><br>💡 No commands are blocked - full system access available</div>
                    </div>
                </div>
            </div>
            
            <script>
                async function executeCommand() {
                    const cmd = document.getElementById('command').value.trim();
                    if (!cmd) {
                        document.getElementById('output').innerHTML = '❌ Please enter a command';
                        return;
                    }
                    
                    document.getElementById('output').innerHTML = '⏳ Executing: ' + cmd + '\\n\\nLoading...';
                    
                    try {
                        const response = await fetch('/exec?cmd=' + encodeURIComponent(cmd));
                        const data = await response.json();
                        
                        let output = '';
                        if (data.success) {
                            output = '✅ Command executed successfully\\n\\n';
                        } else {
                            output = '❌ Command failed\\n\\n';
                        }
                        
                        output += '📝 Command: ' + data.command + '\\n';
                        output += '🔧 Status: ' + (data.success ? 'Success' : 'Failed') + '\\n';
                        output += '⏱️  Time: ' + new Date(data.timestamp).toLocaleString() + '\\n\\n';
                        output += '─'.repeat(50) + '\\n\\n';
                        
                        if (data.stdout) output += '📤 STDOUT:\\n' + data.stdout + '\\n\\n';
                        if (data.stderr) output += '⚠️  STDERR:\\n' + data.stderr + '\\n\\n';
                        if (data.error) output += '💥 ERROR:\\n' + data.error + '\\n\\n';
                        if (!data.stdout && !data.stderr && data.success) output += '✨ No output (command executed successfully)';
                        
                        document.getElementById('output').innerHTML = output;
                    } catch (error) {
                        document.getElementById('output').innerHTML = '❌ Connection error: ' + error.message;
                    }
                }
                
                function setCommand(cmd) {
                    document.getElementById('command').value = cmd;
                    executeCommand();
                }
                
                function clearOutput() {
                    document.getElementById('output').innerHTML = 'Ready to execute commands...';
                    document.getElementById('command').value = '';
                }
                
                document.getElementById('command').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') executeCommand();
                });
                
                async function checkHealth() {
                    try {
                        const response = await fetch('/health');
                        if (response.ok) {
                            document.getElementById('status').innerHTML = '🟢 API Online - Port 6666';
                            document.getElementById('status').className = 'status online';
                        }
                    } catch(e) {
                        document.getElementById('status').innerHTML = '🔴 API Offline';
                        document.getElementById('status').className = 'status offline';
                    }
                }
                checkHealth();
                setInterval(checkHealth, 30000);
            </script>
        </body>
        </html>
    `);
});

// Command execution endpoint (GET) - NO BLOCKING
app.get('/exec', (req, res) => {
    const command = req.query.cmd;
    
    // No command provided
    if (!command) {
        return res.status(400).json({
            success: false,
            error: 'No command provided. Use ?cmd=your_command',
            command: null,
            stdout: '',
            stderr: '',
            timestamp: new Date().toISOString()
        });
    }
    
    console.log(`🔧 Executing from ${req.ip}: ${command}`);
    
    // Execute command with timeout - NO SECURITY CHECKS
    exec(command, { 
        timeout: 60000, // 60 second timeout for long-running commands
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large output
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
    }, (error, stdout, stderr) => {
        const response = {
            success: !error,
            command: command,
            stdout: stdout || '',
            stderr: stderr || '',
            error: error ? error.message : null,
            code: error ? error.code : 0,
            timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Completed from ${req.ip}: ${command} (success: ${!error})`);
        res.json(response);
    });
});

// POST endpoint for command execution (alternative)
app.post('/exec', (req, res) => {
    const command = req.body.cmd || req.body.command;
    
    if (!command) {
        return res.status(400).json({
            success: false,
            error: 'No command provided in POST body',
            timestamp: new Date().toISOString()
        });
    }
    
    // Reuse GET logic
    req.query.cmd = command;
    app.handle(req, res);
});

// Batch command execution
app.post('/exec/batch', (req, res) => {
    const commands = req.body.commands || req.body.cmds;
    
    if (!commands || !Array.isArray(commands)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide an array of commands in {commands: ["cmd1", "cmd2"]}',
            timestamp: new Date().toISOString()
        });
    }
    
    const results = [];
    let completed = 0;
    
    commands.forEach((command, index) => {
        exec(command, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            results[index] = {
                command: command,
                success: !error,
                stdout: stdout || '',
                stderr: stderr || '',
                error: error ? error.message : null
            };
            completed++;
            
            if (completed === commands.length) {
                res.json({
                    success: true,
                    results: results,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        port: PORT,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
        version: '2.0.0',
        security: 'NO COMMAND BLOCKING - Full system access enabled'
    });
});

// System info endpoint
app.get('/info', (req, res) => {
    const os = require('os');
    res.json({
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        uptime: os.uptime(),
        nodeVersion: process.version,
        currentUser: process.env.USER || process.env.USERNAME,
        timestamp: new Date().toISOString()
    });
});

// Environment variables endpoint (useful for devs)
app.get('/env', (req, res) => {
    res.json({
        success: true,
        env: process.env,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
            '/', 
            '/exec (GET/POST)', 
            '/exec/batch (POST)', 
            '/info', 
            '/health',
            '/env'
        ],
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`❌ Server error: ${err.message}`);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// START SERVER - PORT 6666
// ============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 COMMAND EXECUTOR API - DEVELOPMENT MODE');
    console.log('='.repeat(60));
    console.log(`✅ Server running on: http://0.0.0.0:${PORT}`);
    console.log(`🌍 Public access: http://<your-ip>:${PORT}`);
    console.log(`📡 API endpoint: http://<your-ip>:${PORT}/exec?cmd=whoami`);
    console.log(`🌐 Web interface: http://<your-ip>:${PORT}`);
    console.log('='.repeat(60));
    console.log('🔓 NO COMMAND BLOCKING - Full system access enabled');
    console.log('⚠️  For development use only - No security restrictions');
    console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});
