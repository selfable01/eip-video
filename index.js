import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Initialize Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/analyze-visual', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) return res.status(400).json({ error: "Missing videoUrl" });

    try {
        // 1. Use a more descriptive model name and explicit JSON Schema
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { 
                responseMimeType: "application/json",
                // Limit tokens to prevent Vercel 5MB payload issues
                maxOutputTokens: 1000 
            }
        });

        // 2. Strict prompt to avoid empty objects
        const prompt = `
            Act as a visual video analyst. Watch this video and provide:
            1. A 2-sentence visual summary.
            2. A timeline of key visual changes with "time" and "description" keys.
            3. A list of "top_tags".

            IMPORTANT: Ensure the 'timeline' objects are NOT empty. 
            Example: {"time": "00:05", "description": "Child playing with a blue toy car"}

            Return ONLY valid JSON.
        `;

        const result = await model.generateContent([
            { text: prompt },
            { fileData: { mimeType: "video/mp4", fileUri: videoUrl } }
        ]);

        const responseText = result.response.text();
        
        // 3. Debugging: This will show up in your Vercel Logs (Dashboard)
        console.log("Raw Gemini Output:", responseText);

        const analysis = JSON.parse(responseText);

        res.json({
            success: true,
            meta: {
                video_url: videoUrl,
                processed_at: new Date().toISOString()
            },
            analysis: analysis
        });

    } catch (error) {
        console.error("Deployment Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Analysis failed", 
            details: error.message 
        });
    }
});

// 1. ADD THIS ROUTE HERE
app.get('/', (req, res) => {
    res.send("🚀 EIP-Video Visual API is Live! Send a POST request to /api/analyze-visual to begin.");
});

// 2. KEEP YOUR EXISTING CODE BELOW
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Local server on http://localhost:${PORT}`));
}

export default app;