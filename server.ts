import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import fs from "fs/promises";

// Configuration
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  console.log("Initializing Gemini Client. Key present:", !!apiKey, "Source:", process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : (process.env.GOOGLE_API_KEY ? "GOOGLE_API_KEY" : "NONE"));
  
  const ai = new GoogleGenAI({
    apiKey: apiKey || "", 
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      apiKeyPresent: !!apiKey,
      keySource: process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : (process.env.GOOGLE_API_KEY ? "GOOGLE_API_KEY" : "NONE"),
      env: process.env.NODE_ENV
    });
  });

  app.post("/api/evaluate", async (req, res) => {
    try {
      const { transcript, scenario, criteria } = req.body;
      
      console.log("Evaluating transcript for scenario:", scenario.name);
      
      const prompt = `Evaluate this Carvana Advocate training call. 
        Scenario: ${scenario.description}
        Transcript: ${transcript}
        
        Success Criteria:
        ${criteria.map((c: any, i: number) => `${i + 1}. ${c.id}: ${c.text}`).join('\n            ')}

        Scoring Rubric:
        - Score 1 if the Advocate met the criteria, 0 if they missed it.
        - Be fair: if they addressed the topic clearly, give credit.

        Provide feedback in JSON format:
        {
          "scores": {
            ${criteria.map((c: any) => `"${c.id}": 0 or 1`).join(',\n                ')}
          },
          "summary": "A brief summary of performance."
        }`;

      // Log environment for debugging (safely)
      console.log("Evaluation request for:", scenario.name, "Key Source:", process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : "GOOGLE_API_KEY");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: { 
          responseMimeType: "application/json" 
        }
      });

      console.log("Evaluation model response received");
      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error: any) {
      console.error("Evaluation error full:", error);
      res.status(500).json({ 
        error: error.message,
        details: error.status === 403 ? "Authentication scope error. This usually means the API key in Settings > Secrets lacks the 'generativeai' scope or is for a project with restricted permissions." : undefined
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket for Gemini Live API
  const wss = new WebSocketServer({ server, path: "/live" });

  wss.on("connection", async (ws) => {
    console.log("Client connected to /live");
    let session: any = null;

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "setup") {
          console.log("Setting up Gemini Live session for scenario:", msg.scenario?.name);
          try {
            console.log("Connecting to Gemini Live with model: gemini-3.1-flash-live-preview");
            session = await ai.live.connect({
              model: "gemini-3.1-flash-live-preview",
              config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: { },
                outputAudioTranscription: { },
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: msg.scenario.voice || "Zephyr" } },
                },
                systemInstruction: `You are playing a roleplay scenario for a Carvana Advocate training. 
                  Scenario: ${msg.scenario.description}. 
                  Your name is ${msg.scenario.customerName}. 
                  Stay in character as ${msg.scenario.customerName} throughout the call.
                  
                  IMPORTANT: When the advocate speaks, respond as the customer.
                  When the call starts (triggered by [SYSTEM: ANSWER_PHONE]), greet them naturally with "Hello?" or "${msg.scenario.customerName} speaking."`,
              },
              callbacks: {
                onmessage: (message: LiveServerMessage) => {
                  console.log("Gemini Live message received:", JSON.stringify(message).substring(0, 200));
                  
                  // Relay audio and text to client
                  const modelTurn = message.serverContent?.modelTurn;
                  if (modelTurn) {
                    for (const part of modelTurn.parts) {
                      if (part.inlineData) {
                        console.log("Relaying audio chunk to client (" + part.inlineData.data.length + " bytes)");
                        ws.send(JSON.stringify({ type: "audio", data: part.inlineData.data }));
                      }
                      if (part.text) {
                        console.log("Relaying text to client:", part.text);
                        ws.send(JSON.stringify({ type: "text", text: part.text }));
                      }
                    }
                  }
                  const inputTranscription = message.serverContent?.inputTranscription;
                  if (inputTranscription) {
                    ws.send(JSON.stringify({ type: "transcript", text: inputTranscription.text }));
                  }
                  const outputTranscription = message.serverContent?.outputTranscription;
                  if (outputTranscription) {
                    ws.send(JSON.stringify({ type: "text", text: outputTranscription.text }));
                  }
                  if (message.serverContent?.interrupted) {
                    console.log("Interruption received");
                    ws.send(JSON.stringify({ type: "interrupted" }));
                  }
                },
                onclose: () => {
                  console.log("Gemini Live session closed");
                  ws.send(JSON.stringify({ type: "closed" }));
                },
                onerror: (err: any) => {
                  console.error("Gemini Live session error:", err);
                  ws.send(JSON.stringify({ type: "error", message: err.message }));
                }
              }
            });

            console.log("Gemini Live session connected successfully");
            ws.send(JSON.stringify({ type: "ready" }));
          } catch (connectErr: any) {
            console.error("Failed to connect to Gemini Live API:", connectErr);
            ws.send(JSON.stringify({ type: "error", message: `Connection failed: ${connectErr.message}` }));
          }
        } else if (msg.type === "audio" && session) {
          // Log occasionally to verify data flow
          if (Math.random() < 0.05) console.log("Incoming audio from client (" + msg.data.length + " bytes)");
            session.sendRealtimeInput({
              audio: { data: msg.data, mimeType: "audio/pcm;rate=24000" }
            });
        } else if (msg.type === "text" && session) {
          session.sendRealtimeInput({ text: msg.text });
        } else if (msg.type === "nudge" && session) {
          console.log("Sending Nudge to Gemini");
          session.sendRealtimeInput({ text: "[SYSTEM: ANSWER_PHONE]" });
        }
      } catch (error: any) {
        console.error("WS Message handling error:", error);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      if (session) session.close();
    });
  });
}

startServer();
