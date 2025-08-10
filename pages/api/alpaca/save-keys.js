import { adminDb } from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userId, apiKey, secretKey } = req.body;

    if (!userId || !apiKey || !secretKey) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        const privateRef = adminDb.collection('users').doc(userId).collection('private').doc('alpaca_credentials');
        await privateRef.set({ apiKey, secretKey });
        res.status(200).json({ message: 'Alpaca keys saved successfully.' });
    } catch (error) {
        console.error("Error saving Alpaca keys:", error);
        res.status(500).json({ error: 'Could not save API keys to the database.' });
    }
}