import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini with your Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Root Route: This fixes the "Cannot GET /" error
app.get('/', (req, res) => {
    res.send("🚀 EIP-Video Visual API is Live! Send a POST request to /api/analyze-visual.");
});

// The Analysis Route
app.post('/api/analyze-visual', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ success: false, error: "Missing videoUrl" });
    }

    try {
        // Use Gemini 2.5 Flash for speed (crucial for Vercel's 10s limit)
        // Inside your app.post('/api/analyze-visual', ...)
const prompt = `
  Analyze this video. Provide:
  1. A brief "summary".
  2. A "timeline" array. For every 10 seconds of video, provide one object with:
     "time": (e.g., "00:10"),
     "description": (visual event),
     "script": (any spoken words or text on screen, or "N/A" if silent).
  
  Keep descriptions very short (max 10 words) to ensure the response stays under the 10s limit.
  Return ONLY JSON.
`;

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { 
        responseMimeType: "application/json",
        // We set a strict schema so Gemini 2.5 knows exactly what "script" is
        responseSchema: {
            type: "object",
            properties: {
                summary: { type: "string" },
                timeline: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            time: { type: "string" },
                            description: { type: "string" },
                            script: { type: "string" }
                        }
                    }
                }
            }
        }
    }
});

        const result = await model.generateContent([
            { text: prompt },
            { fileData: { mimeType: "video/mp4", fileUri: videoUrl } }
        ]);

        let responseText = result.response.text();

        // CLEANER: Extracts only the JSON part if the AI adds "Here is your JSON..."
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response format");
        
        const cleanAnalysis = JSON.parse(jsonMatch[0]);

        res.json({
            success: true,
            analysis: cleanAnalysis
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Analysis failed", 
            details: error.message 
        });
    }
});

// Local Development Support
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Local server: http://localhost:${PORT}`));
}

export default app;