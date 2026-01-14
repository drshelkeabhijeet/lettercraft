import type { Express } from "express";
import { createServer, type Server } from "node:http";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const N8N_GENERATE_WEBHOOK = "https://abhijeetshelke.app.n8n.cloud/webhook/deb1c6b1-bf9e-46e2-a74b-c902606cbc51";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-letter", async (req, res) => {
    try {
      const { profileId, instructions } = req.body;

      if (!profileId || !instructions) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const response = await fetch(N8N_GENERATE_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileId,
          context: instructions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("n8n webhook error:", response.status, errorText);
        return res.status(response.status).json({ error: "Failed to generate letter" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error generating letter:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/upload-letterhead", async (req, res) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    try {
      const { fileName, fileData, contentType } = req.body;

      if (!fileName || !fileData) {
        return res.status(400).json({ error: "Missing file data" });
      }

      const buffer = Buffer.from(fileData, "base64");

      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/letterheads/${fileName}`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": contentType || "image/png",
          },
          body: buffer,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Supabase upload error:", response.status, errorText);
        return res.status(response.status).json({ error: "Failed to upload letterhead" });
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/letterheads/${fileName}`;
      res.json({ url: publicUrl, fileName });
    } catch (error) {
      console.error("Error uploading letterhead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/letterheads", async (req, res) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/list/letterheads`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prefix: "", limit: 100 }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Supabase list error:", response.status, errorText);
        return res.status(response.status).json({ error: "Failed to list letterheads" });
      }

      const files = await response.json();
      const letterheads = files
        .filter((file: { name: string }) => file.name && !file.name.endsWith("/"))
        .map((file: { name: string }) => ({
          name: file.name,
          url: `${SUPABASE_URL}/storage/v1/object/public/letterheads/${file.name}`,
        }));
      res.json(letterheads);
    } catch (error) {
      console.error("Error listing letterheads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/style-profiles", async (req, res) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Supabase credentials not configured on server");
      return res.status(500).json({ error: "Supabase not configured" });
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/letter_style_profiles?select=*&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Supabase fetch error:", response.status, errorText);
        return res.status(response.status).json({ error: "Failed to fetch profiles" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching style profiles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
