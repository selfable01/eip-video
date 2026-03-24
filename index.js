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
    model: "gemini-2.5-flash",
    generationConfig: { 
        responseMimeType: "application/json",
        // Lower tokens = faster response
        maxOutputTokens: 500, 
        temperature: 0.2 // Lower temperature is faster/more stable
    }
});

        // 2. Strict prompt to avoid empty objects
        const prompt = `
  Analyze this video. BE EXTREMELY BRIEF. 
  1. Summary: Max 15 words.
  2. Timeline: Max 3 key moments.
  3. Tags: Max 3 tags.
  
  Format as JSON: {"summary": "", "timeline": [{"time": "", "description": ""}], "top_tags": []}
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