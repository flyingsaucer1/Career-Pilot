// Read-only checks. Never print credentials or the complete MongoDB URI.
require('dotenv').config();
const { Resolver, setServers } = require('node:dns/promises');
const { isIP } = require('node:net');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

async function databaseCheck() {
  const dnsServers = process.env.DNS_SERVERS?.split(',').map((server) => server.trim()).filter(Boolean) || [];
  if (dnsServers.some((server) => !isIP(server))) return 'FAIL: DNS_SERVERS must contain DNS server IP addresses.';
  if (dnsServers.length) setServers(dnsServers);
  const uri = process.env.MONGODB_URI;
  if (!uri || /<[^>]+>/.test(uri)) return 'FAIL: set MONGODB_URI and replace its password placeholder in server/.env.';
  let parsed;
  try { parsed = new URL(uri); } catch { return 'FAIL: MONGODB_URI is not a valid connection string.'; }
  if (parsed.protocol === 'mongodb+srv:') {
    const resolver = new Resolver({ timeout: 3000, tries: 1 });
    if (dnsServers.length) resolver.setServers(dnsServers);
    try { await resolver.resolveSrv(`_mongodb._tcp.${parsed.hostname}`); }
    catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return 'FAIL: the DNS resolver returned no Atlas SRV record. Compare with another resolver and confirm Connect > Drivers.';
      }
      return `FAIL: Atlas DNS resolver failed (${error.code || 'unknown'}). Check local/network DNS; this does not mean the cluster is offline.`;
    }
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 });
    await mongoose.connection.db.admin().ping();
    return 'PASS: database connection and ping.';
  } catch {
    return 'FAIL: database connection. Check database-user password and Atlas Network Access.';
  } finally {
    await mongoose.disconnect();
  }
}

async function aiCheck() {
  const provider = process.env.AI_PROVIDER || 'gemini';
  if (provider === 'fallback') {
    const configured = [
      process.env.GEMINI_API_KEY && 'Gemini',
      process.env.GROQ_API_KEY && 'Groq',
      process.env.OLLAMA_MODEL && 'Ollama',
    ].filter(Boolean);
    return configured.length
      ? `CONFIGURED: automatic AI fallback (${configured.join(' -> ')}). Run a generation to test provider connectivity.`
      : 'FAIL: configure at least one of GEMINI_API_KEY, GROQ_API_KEY, or OLLAMA_MODEL.';
  }
  if (provider === 'groq') {
    return process.env.GROQ_API_KEY
      ? 'CONFIGURED: Groq (no generation requested).'
      : 'FAIL: set GROQ_API_KEY in server/.env.';
  }
  if (provider === 'gemini') {
    return process.env.GEMINI_API_KEY ? 'CONFIGURED: Gemini (no generation requested).' : 'FAIL: set GEMINI_API_KEY in server/.env.';
  }
  if (provider !== 'ollama') return 'FAIL: AI_PROVIDER must be fallback, groq, gemini, or ollama.';
  const model = process.env.OLLAMA_MODEL;
  if (!model) return 'FAIL: set OLLAMA_MODEL.';
  try {
    const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Ollama unavailable');
    const payload = await response.json();
    const tag = model.includes(':') ? model : `${model}:latest`;
    return payload.models?.some((entry) => entry.name === tag)
      ? `PASS: Ollama model ${tag} is installed (inference not tested by doctor).`
      : `FAIL: download the configured model with ollama pull ${model}.`;
  } catch { return 'FAIL: start Ollama and check OLLAMA_BASE_URL.'; }
}

async function storageCheck() {
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  try { await cloudinary.api.ping({ timeout: 8000 }); return 'PASS: Cloudinary connection.'; }
  catch { return 'FAIL: check Cloudinary credentials and internet connectivity.'; }
}

Promise.all([databaseCheck(), aiCheck(), storageCheck()]).then((results) => {
  for (const result of results) console.log(result);
  if (results.some((result) => result.startsWith('FAIL:'))) process.exitCode = 1;
}).catch(() => { console.error('Setup check failed. Review server/.env locally.'); process.exitCode = 1; });
