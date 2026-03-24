import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Initialize Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/analyze-visual', async (req, res) => {
    try {
        // 1. Use 3.1 Flash-Lite for maximum speed and sub-10s response
        const model = genAI.getGenerativeModel({ 
            model: "3.1-flash-lite", // Use 1.5-flash or 3.1-flash-lite if available
            systemInstruction: "You are a JSON-only API. Never speak. Never use markdown. Output ONLY raw JSON strings."
        });

        const prompt = "Analyze video. Return JSON: {\"summary\": \"1 sentence\", \"top_tags\": [\"3 tags\"]}";

        const result = await model.generateContent([
            { text: prompt },
            { fileData: { mimeType: "video/mp4", fileUri: req.body.videoUrl } }
        ]);

        let text = result.response.text();

        // 2. THE CLEANER: Removes everything except the JSON brackets
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        const cleanJson = JSON.parse(jsonMatch[0]);

        res.json({ success: true, analysis: cleanJson });

    } catch (error) {
        console.error("Parse Error:", error);
        res.status(500).json({ success: false, error: "AI Response was not valid JSON", details: error.message });
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