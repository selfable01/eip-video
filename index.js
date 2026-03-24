import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Initialize Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/analyze-visual', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            // 1. System Instruction is the strongest way to force JSON
            systemInstruction: "You are a JSON-only generator. Never include conversational text like 'Here is' or 'Certainly'. Output only valid JSON.",
        });

        const result = await model.generateContent({
            contents: [{ 
                parts: [
                    { text: "Analyze video. Return JSON: {\"summary\": \"string\", \"top_tags\": [\"string\"]}" },
                    { fileData: { mimeType: "video/mp4", fileUri: req.body.videoUrl } }
                ] 
            }],
            generationConfig: { 
                responseMimeType: "application/json", // Forces JSON Mode
                maxOutputTokens: 200,
                temperature: 0.1 
            }
        });

        let responseText = result.response.text();

        // 2. Cleaning Regex: Removes ```json ... ``` blocks if Gemini adds them
        responseText = responseText.replace(/```json|```/g, "").trim();

        res.json({ success: true, analysis: JSON.parse(responseText) });

    } catch (error) {
        console.error("JSON Error:", error);
        res.status(500).json({ success: false, error: "AI Response was not valid JSON" });
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