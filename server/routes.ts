import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { getUncachableGitHubClient } from "./github";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const N8N_GENERATE_WEBHOOK = "https://abhijeetshelke.app.n8n.cloud/webhook/8c5dfe13-c448-40c3-98be-84a62cbf1dc4";
const GITHUB_REPO_OWNER = "drshelkeabhijeet";
const GITHUB_REPO_NAME = "lettercraft";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-letter", async (req, res) => {
    try {
      const { ocr_set_name, instruction } = req.body;

      if (!ocr_set_name || !instruction) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const response = await fetch(N8N_GENERATE_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ocr_set_name,
          instruction,
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
        `${SUPABASE_URL}/rest/v1/letter_ocr_samples?select=id,ocr_set_name,created_at&order=created_at.desc`,
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
      const uniqueProfiles = data.reduce((acc: any[], item: any) => {
        if (!acc.find((p: any) => p.ocr_set_name === item.ocr_set_name)) {
          acc.push({
            id: item.id,
            ocr_set_name: item.ocr_set_name,
            created_at: item.created_at,
          });
        }
        return acc;
      }, []);
      res.json(uniqueProfiles);
    } catch (error) {
      console.error("Error fetching style profiles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/push-to-github", async (req, res) => {
    try {
      const octokit = await getUncachableGitHubClient();
      const { message } = req.body;
      const commitMessage = message || "Update from LetterCraft app";

      const { data: ref } = await octokit.git.getRef({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        ref: "heads/main",
      });
      const latestCommitSha = ref.object.sha;

      const { data: latestCommit } = await octokit.git.getCommit({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        commit_sha: latestCommitSha,
      });
      const baseTreeSha = latestCommit.tree.sha;

      const workspaceDir = process.cwd();
      const ignoreDirs = [
        "node_modules",
        ".git",
        ".cache",
        ".config",
        "dist",
        ".expo",
        ".replit",
        "replit.nix",
      ];
      const ignoreFiles = [".replit", "replit.nix", ".env"];

      function getAllFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const relativePath = path.relative(workspaceDir, filePath);
          const firstDir = relativePath.split(path.sep)[0];
          if (ignoreDirs.includes(firstDir) || ignoreFiles.includes(file)) {
            continue;
          }
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
          } else {
            fileList.push(relativePath);
          }
        }
        return fileList;
      }

      const allFiles = getAllFiles(workspaceDir);
      const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];

      for (const filePath of allFiles) {
        const fullPath = path.join(workspaceDir, filePath);
        const content = fs.readFileSync(fullPath);
        const encoding = content.toString("utf8").includes("\ufffd") ? "base64" : "utf-8";
        const { data: blob } = await octokit.git.createBlob({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          content: encoding === "base64" ? content.toString("base64") : content.toString("utf8"),
          encoding,
        });
        treeItems.push({
          path: filePath,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
      }

      const { data: newTree } = await octokit.git.createTree({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      const { data: newCommit } = await octokit.git.createCommit({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        message: commitMessage,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      await octokit.git.updateRef({
        owner: GITHUB_REPO_OWNER,
        repo: GITHUB_REPO_NAME,
        ref: "heads/main",
        sha: newCommit.sha,
      });

      res.json({
        success: true,
        message: "Code pushed to GitHub successfully",
        commitSha: newCommit.sha,
        filesUpdated: allFiles.length,
      });
    } catch (error: any) {
      console.error("Error pushing to GitHub:", error);
      res.status(500).json({
        error: "Failed to push to GitHub",
        details: error.message,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
