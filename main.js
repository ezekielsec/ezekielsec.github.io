const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse query parameters and JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (optional, if you want to serve frontend from same server)
app.use(express.static('public'));

// Command execution endpoint
app.get('/exec', (req, res) => {
    const command = req.query.cmd;
    
    // Security check - block dangerous commands
    const dangerousCommands = ['rm -rf', 'format', 'del /f', 'rd /s', 'mkfs', 'dd if=', ':(){:|:&};:', 'shutdown', 'reboot'];
    if (dangerousCommands.some(dangerous => command?.toLowerCase().includes(dangerous))) {
        return res.status(403).json({
            success: false,
            error: 'Command blocked for security reasons',
            command: command
        });
    }
    
    if (!command) {
        return res.status(400).json({
            success: false,
            error: 'No command provided. Use ?cmd=your_command'
        });
    }

    console.log(`[${new Date().toISOString()}] Executing: ${command}`);

    // Execute command with timeout to prevent hanging
    exec(command, { 
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
        const response = {
            success: !error,
            command: command,
            stdout: stdout || '',
            stderr: stderr || '',
            error: error ? error.message : null
        };

        res.json(response);
        
        console.log(`[${new Date().toISOString()}] Completed: ${command}`);
        if (error) {
            console.error(`Error: ${error.message}`);
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Get system info endpoint
app.get('/system-info', (req, res) => {
    exec('echo OS: $OSTYPE || echo OS: Windows', (error, stdout) => {
        res.json({
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            os: stdout.trim()
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Command execution server running on http://localhost:${PORT}`);
    console.log(`📝 Usage: http://localhost:${PORT}/exec?cmd=your_command_here`);
    console.log(`⚠️  Warning: This is for development use only! Add proper authentication for production.`);
});