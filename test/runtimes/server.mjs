// The HTTP server the runtime smoke tests send their requests to.
import { Buffer } from 'node:buffer';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { brotliDecompressSync } from 'node:zlib';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const readAll = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
};

/** Starts the server and resolves to its URL, the payload of `/download` and the number of hits by path. */
export async function startServer() {
    const payload = randomBytes(1024 * 1024);
    const hits = {};

    const server = createServer(async (req, res) => {
        const path = req.url.split('?')[0];
        hits[path] = (hits[path] ?? 0) + 1;
        const json = (status, body) => {
            res.writeHead(status, { 'content-type': 'application/json' });
            res.end(JSON.stringify(body));
        };

        if (path === '/ok') return json(200, { data: { id: 'abc', createdAt: '2026-01-01T00:00:00.000Z' } });
        if (path === '/flaky') {
            // Bun reuses a connection whose stream body the server left unread, which breaks the request after it.
            await readAll(req);
            return hits[path] < 3 ? json(500, { error: { type: 'x', message: 'boom' } }) : json(200, {});
        }
        if (path === '/not-found') return json(404, { error: { type: 'record-not-found', message: 'Not here' } });
        if (path === '/reset') return hits[path] < 2 ? req.socket.destroy() : json(200, {});
        if (path === '/stall') return hits[path] < 2 ? undefined : json(200, {});
        if (path === '/echo') {
            const raw = await readAll(req);
            const encoding = req.headers['content-encoding'];
            const body = encoding === 'br' ? brotliDecompressSync(raw) : raw;
            return json(200, {
                sha256: sha256(body),
                encoding: encoding ?? null,
                authorization: req.headers.authorization ?? null,
                userAgent: req.headers['user-agent'] ?? null,
            });
        }
        if (path === '/download') {
            res.writeHead(200, { 'content-type': 'application/octet-stream' });
            return res.end(payload);
        }
        return json(418, {});
    });
    await new Promise((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });

    return {
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        hits,
        payload,
        close: () => {
            server.closeAllConnections();
            server.close();
        },
    };
}
