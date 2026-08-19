/*
  ZeZo Login API (Vercel serverless)
  ---------------------------------------------------
  Endpoint ini dipanggil dari form login di index.html (AppBeta).
  Dia cek username/password ke MongoDB yang SAMA dipakai bot Telegram
  (jadi key yang di-generate lewat /ckey bisa langsung dipakai login).

  Route: POST /api/login   body: { username, password }
*/

const { MongoClient } = require('mongodb');

/* ================= ISI DI SINI: connection string MongoDB yang sama dipakai bot ================= */
const MONGO_URI = 'mongodb+srv://rajawa110279_db_user:8dW7t7oMC7KIwWdo@zezodatabase.bvkyzb2.mongodb.net/?appName=zezodatabase';
/* =================================================================================================== */

let cachedClient = null;

async function getDb() {
  if (cachedClient) return cachedClient.db('zezoapp');
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  cachedClient = client;
  return client.db('zezoapp');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
  }
  const username = (body.username || '').trim();
  const password = (body.password || '').trim();

  if (!username || !password) {
    return res.json({ success: false, message: 'Username/Password gak boleh kosong.' });
  }

  try {
    const db = await getDb();
    const doc = await db.collection('keys').findOne({ username, password });
    if (!doc) return res.json({ success: false, message: 'Username/Password salah.' });
    if (doc.expiredAt && new Date(doc.expiredAt) < new Date()) {
      return res.json({ success: false, message: 'Key sudah expired.' });
    }
    res.json({ success: true, username: doc.username });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Server error: ' + err.message });
  }
};
