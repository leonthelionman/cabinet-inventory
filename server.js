require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// Load and decode the service account JSON from base64
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_KEY_BASE64, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const docRef = db.collection('inventory').doc('data');

app.get('/api/data', async (req, res) => {
  try {
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'No data found' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data from Firestore' });
  }
});

app.post('/api/save', async (req, res) => {
  try {
    await docRef.set(req.body, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save data to Firestore' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// (Optional) Remove or comment out backup logic for now.