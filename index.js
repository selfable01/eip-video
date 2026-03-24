import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Initialize Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/analyze-visual', async (req, res) => {
    const { videoUrl } = req.body;

    try {
        console.log(`✨ Cleaning up analysis for: ${videoUrl}`);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Analyze this video visually. Output a JSON with "overview", "scenes", and "tags".`;

        const result = await model.generateContent([
            { text: prompt },
            { fileData: { mimeType: "video/mp4", fileUri: videoUrl } }
        ]);

        const data = JSON.parse(result.response.text());

        // Tidy Up: We restructure the response for your frontend
        const tidyResponse = {
            success: true,
            meta: {
                video_url: videoUrl,
                processed_at: new Date().toISOString()
            },
            analysis: {
                summary: data.summary || data.overview,
                // We simplify the scenes to just time and event
                timeline: (data.scenes || []).map(s => ({
                    time: s.timestamp,
                    event: s.description
                })),
                // We limit tags to the top 10 most relevant visual elements
                top_tags: (data.detected_elements || []).slice(0, 10)
            }
        };

        res.json(tidyResponse);

    } catch (error) {
        res.status(500).json({ error: "Failed to tidy up the visual data." });
    }
});

app.listen(3000, () => console.log("🚀 Gemini 2.5 Visual API Live"));
export default app;