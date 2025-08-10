/**
 * @file pages/api/ai-analysis.js
 * @description This API endpoint connects to the Google Gemini API to provide AI-powered
 * analysis based on a given prompt. It securely uses an API key from environment variables.
 */

// Import the GoogleGenerativeAI class from the official SDK
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Initialization ---
// Access your API key from the environment variables (stored in .env.local)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * The main handler for the AI analysis API route.
 * It expects a POST request with a 'prompt' in the body.
 */
export default async function handler(req, res) {
    // Ensure the request is a POST request
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt } = req.body;

    // Validate that a prompt was provided
    if (!prompt) {
        return res.status(400).json({ error: 'A prompt is required for AI analysis.' });
    }

    try {
        // --- Gemini API Call ---
        // 1. Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 2. Generate content based on the user's prompt
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // 3. Extract the text from the response
        const analysisText = response.text();

        // 4. Send the successful response back to the frontend
        res.status(200).json({ analysis: analysisText });

    } catch (error) {
        // --- Error Handling ---
        console.error('AI Analysis API Error:', error);
        res.status(500).json({ error: 'Failed to get analysis from the AI service. Please check the server logs.' });
    }
}
