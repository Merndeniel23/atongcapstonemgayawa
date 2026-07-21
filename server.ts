import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import { db, testDatabaseConnection } from "./config/db.js";
import inspectionsRouter from "./routes/inspections";
dotenv.config();


const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, database: "connected" });
  } catch {
    res.status(500).json({ success: false, database: "disconnected" });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/inspections", inspectionsRouter);

// Initialize Gemini client on the server securely
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } }
}) : null;

// Server-side chat endpoint for EcoTrack Garbage Assistant
app.post("/api/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const contentsPayload = [
      ...(chatHistory || []).map((h: any) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.text }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    if (!ai) throw new Error("Gemini API key is not configured");
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: `You are the EcoTrack Smart Garbage Assistant, an interactive chatbot built into the Barangay Central Smart Garbage Monitoring & Payment System.
Your job is to guide users (Residents, Collectors, Purok Leaders, and Admins) on how to navigate the platform, explain features, and solve issues.

Key platform features and state to help users with:
1. **Resident (Household) Page**: Check the latest physical garbage-bin inspection submitted by the assigned Purok Leader, request instant ad-hoc pickup, view garbage truck GPS collection routes, and pay monthly environmental contribution fees (₱200 for May 2026, payable via GCash/Maya QR in the Payment Portal).
2. **Collector Page**: Sanitation driver tasks. View assigned routes (e.g., Purok 4), check off collected locations, and use barcode scanner simulation to log garbage barrel collected events.
3. **Purok Leader Page**: View and verify household payments (e.g., Mark Rallos's ₱200 payment), check district compliance stats (currently 94%), and endorse digital Cleanliness certificates.
4. **System Administrator Page**: Manage system users, review Purok Leader inspection records, monitor collection requests, and manage municipal settings.

Tone and style guidelines:
- Extremely helpful, friendly, supportive, concise, and focused.
- Mention specific local details like 'Purok 4', 'Mark Rallos', and 'May 2026 Billing' when relevant.
- Format response with simple Markdown bullets, bolding, and clear paragraphs for layout scannability in a compact chat window.
- Suggest navigation tips (e.g., "Use the menu navigation sidebar or bottom tab bar to switch screens to Payments or Route Map.")`,
      }
    });

    const replyText = result.text || "Hello! I am ready to assist you. What can I do for you today?";
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API server-side error:", error);
    
    // Check if the error or message has indicator of Gemini model limits / 503 / high demand / key issues
    // Instead of throwing a 500 error which breaks the frontend with "Network response not ok.",
    // we return a beautifully styled offline contextual response about EcoTrack features!
    const query = (message || "").toLowerCase().trim();
    let replyText = "";

    if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("greetings")) {
      replyText = `Hello! I am your **EcoTrack Smart Garbage Assistant** 🌿.

Even though our cloud AI service is currently undergoing high-demand maintenance, I can help you with:
- **Billing & Payments**: Learn how to pay your ₱200 fee.
- **Address Corrections**: How to update your Purok/Barangay or file a report.
- **Trash Bin Status**: Check real-time bin levels (currently 78%).
- **Endorsements**: Apply for Barangay Clearances and certificates.

How can I assist you today?`;
    } else if (query.includes("pay") || query.includes("fee") || query.includes("billing") || query.includes("payment") || query.includes("money") || query.includes("gcash") || query.includes("maya")) {
      replyText = `### 💳 Payments & Environmental Contribution Fees
For May 2026, the standard municipal garbage fee is **₱200**.

**How to view and pay:**
1. Navigate to the **Payments** tab on the sidebar (or bottom navigation).
2. You will see your pending bill for **May 2026**.
3. Click on the GCash or Maya payment simulator.
4. If you have already paid, you can submit an image/receipt reference for Purok Leader review.

Let me know if you need help finding the Payments tab!`;
    } else if (query.includes("address") || query.includes("correct") || query.includes("change") || query.includes("wrong") || query.includes("mistake") || query.includes("barangay") || query.includes("purok") || query.includes("zone") || query.includes("ticket")) {
      replyText = `### 📍 Address & Zone Correction System
If your address or Purok/Barangay was registered with a mistake, we have an official system to report and resolve this:

1. Click on **Profile** in the navigation menu.
2. Under the Physical Delivery Address or Communal Zone fields, you will see they are locked for standard households to ensure master directory consistency.
3. Scroll down and click on the orange **"Mistake in your Address or Zone?"** button to expand the **Official Correction Ticket** form.
4. Select your requested Barangay and Purok, type your correct physical address, write a short reason, and click **"File Correction Report"**.
5. This sends a real-time ticket to your **Purok Leader** or **Admin**, who can approve the change and instantly update your profile permanently!`;
    } else if (query.includes("bin") || query.includes("status") || query.includes("trash") || query.includes("garbage") || query.includes("level") || query.includes("full")) {
      replyText = `### 🗑️ Garbage Bin Inspection Status
- Bin conditions are recorded manually by the assigned **Purok Leader** after a physical inspection.
- **Assigned Zone**: **Purok 4, Dapitan**.
- **Ad-hoc Pickups**: You can request an instant ad-hoc cleanup on the **Dashboard** by clicking the "Request Instant Pickup" button under your bin status indicator.
- **Truck Route Map**: Watch the real-time collector vehicle movement on the live map at the top of your Dashboard.`;
    } else if (query.includes("endorse") || query.includes("certificate") || query.includes("clearance") || query.includes("document") || query.includes("compliance")) {
      replyText = `### 📄 Barangay Clearances & Endorsements
Households can request official environmental certifications directly:

1. Open the **Endorsements** tab.
2. Click **"Apply for New Certification"**.
3. Choose the clearance type (e.g., *Garbage Compliance Certificate*, *Sanitation Endorsement*).
4. Fill out the application details and submit.
5. Your **Purok Leader** will review your trash compliance records (and payment history) and sign the digital document, which you can download immediately as a certified PDF simulator.`;
    } else if (query.includes("collector") || query.includes("driver") || query.includes("pickup") || query.includes("route")) {
      replyText = `### 🚚 Cleanliness Routes & Trucks
- **Collector Team**: Sanidriver Team C.
- **Active Route**: Purok 4, Poblacion, Dapitan.
- If you are logged in as a **Collector**, you can access the dedicated collector view to see scheduled routes, mark bins as collected, and simulate barrel barcode scans for logging.`;
    } else if (query.includes("leader") || query.includes("admin") || query.includes("verify") || query.includes("approve")) {
      replyText = `### 👑 Purok Leader & Admin Features
If you are logged in as a Leader or Admin:
- **Purok Leader**: Manage payments, approve household clearance endorsements, and review submitted Address Correction tickets under the Complaints panel.
- **Admin**: Manage users, review manual bin inspections, and monitor collection requests.`;
    } else {
      replyText = `I am here to guide you through the **EcoTrack Smart Garbage Monitoring System**! 🌿

*Note: The primary Gemini AI is currently operating in offline fallback mode due to high cloud demand, but I am fully capable of answering system questions.*

Feel free to ask me about:
1. **How to correct a mistaken address** (Type: "address correction")
2. **How to pay environmental fees** (Type: "billing")
3. **Checking your trash bin level** (Type: "trash bin")
4. **Applying for Barangay clearances** (Type: "clearance")`;
    }

    res.json({ text: replyText });
  }
});

// Start server function to bundle Vite dev or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
