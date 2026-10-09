// Test-only TLS server: exercise the production build without disabling CSP or
// Secure cookies. Certificates are ephemeral and never trusted system-wide.
import next from "next";
import https from "node:https";
import { readFileSync } from "node:fs";
const app = next({ dev: false, hostname: "localhost", port: 3014 });
await app.prepare();
const handle = app.getRequestHandler();
const tlsDirectory = process.env.RESTAURANT_TEST_TLS_DIR ?? ".s3a-local";
https.createServer({ key: readFileSync(`${tlsDirectory}/key.pem`), cert: readFileSync(`${tlsDirectory}/cert.pem`) }, (req, res) => {
 // Match a trusted TLS terminator: overwrite, never trust a client-supplied value.
 req.headers["x-forwarded-proto"] = "https";
 return handle(req, res);
}).listen(3014, "127.0.0.1", () => console.log("Isolated HTTPS production website ready on port 3014"));
