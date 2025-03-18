// server.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
//const fetch = require("node-fetch"); // Remove this if using Node 18+

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer(); // Use multer to handle multipart/form-data

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (like your donate.html and others) from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// New endpoint to handle translation file uploads
app.post("/upload-translation", upload.single("file"), async (req, res) => {
  try {
    const { language } = req.body;
    const file = req.file;
    if (!language || !file) {
      return res.status(400).json({ error: "Missing language or file" });
    }

    // Get the original filename from the uploaded file
    const fileName = file.originalname;
    // Convert the file buffer to a base64 string
    const base64Content = file.buffer.toString("base64");

    // Read the GitHub API key from environment variables
    const githubApiKey = process.env.GITHUB_API_KEY;
    if (!githubApiKey) {
      return res.status(500).json({ error: "GitHub API key not configured" });
    }

    // GitHub API URL to upload content
    const apiUrl = `https://api.github.com/repos/rpi10/OpenChatV2/contents/${fileName}`;

    // Call the GitHub API to upload the file
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `token ${githubApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Add ${language} translation`,
        content: base64Content,
        branch: "main"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("GitHub API error:", errorData);
      return res.status(500).json({ error: "Error uploading to GitHub", details: errorData });
    }

    res.json({ message: "Translation uploaded successfully!" });
  } catch (error) {
    console.error("Error in /upload-translation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
