const http = require('http');
const fs = require('fs');
const path = require('path');

// ==========================================
// ZERO-DEPENDENCY LOCAL ENVIRONMENT LOADER
// ==========================================
function loadLocalEnv() {
    const envFiles = ['.env.local', '.env'];
    for (const file of envFiles) {
        const fullPath = path.join(__dirname, file);
        if (fs.existsSync(fullPath)) {
            try {
                const raw = fs.readFileSync(fullPath, 'utf-8');
                const lines = raw.split(/\r?\n/);
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    const eqIdx = trimmed.indexOf('=');
                    if (eqIdx !== -1) {
                        const key = trimmed.slice(0, eqIdx).trim();
                        let val = trimmed.slice(eqIdx + 1).trim();
                        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.slice(1, -1);
                        }
                        if (!process.env[key]) {
                            process.env[key] = val;
                        }
                    }
                }
                console.log(`[ENV] ✅ Loaded environment variables from ${file}`);
                break;
            } catch (err) {
                console.warn(`[ENV] Warning loading ${file}:`, err.message);
            }
        }
    }
}

loadLocalEnv();

// ==========================================
// LOAD SERVERLESS HANDLERS
// ==========================================
let chatHandler = null;
try {
    chatHandler = require('./api/chat.js');
} catch (e) {
    console.warn('[ROUTER] Warning: api/chat.js could not be loaded:', e.message);
}

let calendarHandler = null;
try {
    calendarHandler = require('./api/calendar.js');
} catch (e) {
    console.warn('[ROUTER] Warning: api/calendar.js could not be loaded:', e.message);
}

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.md': 'text/markdown; charset=utf-8'
};

function prepareServerlessRes(res) {
    res.status = function(code) {
        res.statusCode = code;
        return this;
    };
    res.json = function(data) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        res.end(JSON.stringify(data));
        return this;
    };
    return res;
}

function parseRequestBody(req) {
    return new Promise((resolve) => {
        let chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const str = buffer.toString('utf-8');
            if (!str) return resolve({});
            try {
                resolve(JSON.parse(str));
            } catch (e) {
                resolve(str);
            }
        });
        req.on('error', () => resolve({}));
    });
}

const server = http.createServer(async (req, res) => {
    let reqUrl = req.url.split('?')[0];

    // 1. API Route: OpenRouter RAG Copilot (/api/chat)
    if (reqUrl.startsWith('/api/chat')) {
        if (chatHandler) {
            prepareServerlessRes(res);
            req.body = await parseRequestBody(req);
            return chatHandler(req, res);
        } else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Chat API handler not available' }));
        }
    }

    // 2. API Route: Google Calendar Scheduler (/api/calendar)
    if (reqUrl.startsWith('/api/calendar')) {
        if (calendarHandler) {
            prepareServerlessRes(res);
            req.body = await parseRequestBody(req);
            return calendarHandler(req, res);
        } else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Calendar API handler not available' }));
        }
    }

    // 3. Static File Server
    if (reqUrl === '/') reqUrl = '/index.html';

    const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });

        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Live local server running at http://localhost:${PORT}`);
    console.log(`📡 API Routes active: /api/chat (RAG Copilot) · /api/calendar (Scheduler)`);
});
