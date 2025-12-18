import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function checkModel() {
  let apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  
  // Manual text parsing for .env.local if not found
  if (!apiKey) {
      try {
          const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
          const match = envLocal.match(/GOOGLE_API_KEY=(.+)/);
          if (match && match[1]) {
              apiKey = match[1].trim().replace(/^["']|["']$/g, '');
              console.log("Loaded API key from .env.local");
          }
      } catch (e) {
          console.log("Could not read .env.local");
      }
  }

  if (!apiKey) {
    console.error("No API KEY found");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  try {
    console.log("Testing gemini-3-flash-preview...");
    const result = await model.generateContent("Hello?");
    const response = await result.response;
    console.log("Success:", response.text());
  } catch (error: any) {
    console.error("Error with gemini-3-flash-preview:", error.message);
  }

  // Also enable this to list models if possible, though the SDK doesn't always expose listModels directly on the main class in older versions. 
  // We'll try a raw fetch just in case.
  try {
    console.log("Listing models...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
        console.log("Available models:");
        data.models.forEach((m: any) => {
            if (m.name.includes("gemini")) {
                console.log(" - " + m.name);
            }
        });
    } else {
        console.log("Could not list models:", data);
    }
  } catch (e) {
    console.error("Failed to list models", e);
  }
}

checkModel();
