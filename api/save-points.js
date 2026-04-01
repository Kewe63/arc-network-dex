import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { address, totalPoints, referralCode } = req.body;

  if (!address || totalPoints === undefined) {
    res.status(400).json({ error: 'Missing address or totalPoints' });
    return;
  }

  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db('arc-dex');
    const leaderboard = db.collection('leaderboard');

    // Upsert: var ise güncelle, yoksa yeni oluştur
    const result = await leaderboard.updateOne(
      { address: address.toLowerCase() },
      {
        $set: {
          address: address.toLowerCase(),
          displayAddress: address,
          totalPoints,
          referralCode: referralCode || '',
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Points saved',
      acknowledged: result.acknowledged,
    });
  } catch (error) {
    console.error('MongoDB error:', error);
    res.status(500).json({ error: 'Failed to save points', details: error.message });
  } finally {
    if (client) await client.close();
  }
}

export default handler;
