const express = require("express");
const multer = require("multer");
const fs = require("fs").promises;
const MiniToolDB = require("../models/MiniToolDB");
const {getZipFileEntryByBuffer, storeZipFileOnDiskAsync, deletZilpFileAsync} = require("../Services/ReactZipFileProcessingService");

// Helper function to get the base URL for full paths
function getBaseUrl() {
  const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (baseUrl) {
    return baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }
  // Fallback to localhost with port
  const port = process.env.PORT || 4010;
  return `http://127.0.0.1:${port}`;
}

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed") {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed"), false);
    }
  },
});

function withIframeUrl(tool) {
  if (!tool) {
    return tool;
  }

  const plain =
    typeof tool.toObject === "function" ? tool.toObject({ virtuals: true }) : { ...tool };

  // Remove file path from response (internal use only)
  if (plain.reactAppZipPath) {
    delete plain.reactAppZipPath;
  }

  const iframeUrl = plain.appType === 'react'
      ? (plain.reactAppUrl || `/mini-tools-react/${plain.iframeSlug}/`)
      : `/mini-tools/${plain.iframeSlug}`;

  return {
    ...plain,
    iframeUrl, // Relative path for same-origin use
  };
}

router.get("/search-tools", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Query parameter 'q' is required." });
    }

    const searchQuery = q.trim();
    
    // Create a case-insensitive regex pattern for searching
    const searchRegex = new RegExp(searchQuery, "i");

    // Search across title, summary, and description fields
    const tools = await MiniToolDB.find({
      $or: [
        { title: searchRegex },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const results = tools.map(withIframeUrl);
    res.json(results);
  } catch (error) {
    console.error("Error searching tools:", error);
    res.status(500).json({ message: "Internal server error while searching tools." });
  }
});

router.get("/", async (_req, res) => {
  const tools = (await MiniToolDB.find()
      .sort({ createdAt: -1 })
      .lean())
      .map(withIframeUrl);
  // withIframeUrl will compute iframeUrl for each tool
  res.json(tools);
});

router.post("/", async (req, res, next) => {
  try {
    const { id, title, summary, description, thumbnail, iframeSlug, appType } =
      req.body;

    if (
      !id ||
      !title ||
      !summary ||
      !description ||
      !Array.isArray(description) ||
      description.length === 0 ||
      !thumbnail ||
      !iframeSlug
    ) {
      return res.status(400).json({ message: "All fields are required, and description must be a non-empty array." });
    }

    // Validate each description block
    for (let i = 0; i < description.length; i++) {
      const block = description[i];
      if (!block || typeof block !== 'object') {
        return res.status(400).json({ message: `Description block ${i + 1} must be an object.` });
      }
      if (!block.image || typeof block.image !== 'string') {
        return res.status(400).json({ message: `Description block ${i + 1} must have a valid image URL.` });
      }
      if (!block.text || typeof block.text !== 'string') {
        return res.status(400).json({ message: `Description block ${i + 1} must have text.` });
      }
      if (!block.orientation || !['left', 'right'].includes(block.orientation)) {
        return res.status(400).json({ message: `Description block ${i + 1} must have orientation 'left' or 'right'.` });
      }
    }

    const createData = {
      id,
      title,
      summary,
      description,
      thumbnail,
      iframeSlug,
      appType: appType,
    };

    const created = await MiniToolDB.create(createData);

    res.status(201).json(withIframeUrl(created));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Tool id or iframeSlug already exists.",
      });
    }
    next(error);
  }
});

router.get("/:id", async (req, res) => {
  const tool = await MiniToolDB.findOne({ id: req.params.id });

  if (!tool) {
    return res.status(404).json({ message: "Tool not found." });
  }

  // If React app has relative URL, update it to full URL
  if (tool.appType === 'react' && tool.reactAppUrl && !tool.reactAppUrl.startsWith('http')) {
    const baseUrl = getBaseUrl();
    const reactAppPath = tool.reactAppUrl.startsWith('/') 
      ? tool.reactAppUrl 
      : `/mini-tools-react/${tool.iframeSlug}/`;
    tool.reactAppUrl = `${baseUrl}${reactAppPath}`;
    await tool.save();
  }

  res.json(withIframeUrl(tool));
});

router.put("/:id", async (req, res, next) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.id;
    delete updates.reactAppZip; // Prevent direct zip updates via PUT

    // Validate description blocks if provided
    if (updates.description !== undefined) {
      if (!Array.isArray(updates.description) || updates.description.length === 0) {
        return res.status(400).json({ message: "Description must be a non-empty array." });
      }
      
      // Validate each description block
      for (let i = 0; i < updates.description.length; i++) {
        const block = updates.description[i];
        if (!block || typeof block !== 'object') {
          return res.status(400).json({ message: `Description block ${i + 1} must be an object.` });
        }
        if (!block.image || typeof block.image !== 'string') {
          return res.status(400).json({ message: `Description block ${i + 1} must have a valid image URL.` });
        }
        if (!block.text || typeof block.text !== 'string') {
          return res.status(400).json({ message: `Description block ${i + 1} must have text.` });
        }
        if (!block.orientation || !['left', 'right'].includes(block.orientation)) {
          return res.status(400).json({ message: `Description block ${i + 1} must have orientation 'left' or 'right'.` });
        }
      }
    }

    const tool = await MiniToolDB.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: "Tool not found." });
    }

    const updated = await MiniToolDB.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true, runValidators: true }
    );

    res.json(withIframeUrl(updated));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "iframeSlug already exists.",
      });
    }
    next(error);
  }
});

router.post("/:id/upload-react-app", upload.single("reactApp"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const tool = await MiniToolDB.findOne({ id: req.params.id });

    if (!tool) {
      return res.status(404).json({ message: "Tool not found." });
    }

    const entries = getZipFileEntryByBuffer(req.file.buffer);
    console.log(`[Upload] Zip file has ${entries.length} entries`);
    if (entries.length > 0) {
      console.log(`[Upload] First 10 entries:`, entries.slice(0, 10).map(e => e.entryName));
    }

    if (!isHasIndexHtmlExist(entries)) {
      console.error(`[Upload] No index.html found in zip. Entries:`, entries.slice(0, 20).map(e => e.entryName));
      return res.status(400).json({ 
        message: "Zip file must contain an index.html file." 
      });
    }

    console.log(`[Upload] index.html found, proceeding to save file`);
    const zipFilePath = await storeZipFileOnDiskAsync(tool.id,req.file.buffer  ,req.file.buffer.length)
    console.log(`[Upload] File saved successfully: ${zipFilePath}`);

    // Delete old zip file if it exists
    if (tool.reactAppZipPath) {
      try {
        deletZilpFileAsync(tool.reactAppZipPath);
      } catch (err) {
        console.warn(`Could not delete old zip file: ${tool.reactAppZipPath}`);
      }
    }

    const baseUrl = getBaseUrl();
    const reactAppPath = `/mini-tools-react/${tool.iframeSlug}/`;

    tool.reactAppZipPath = zipFilePath ;
    tool.reactAppUrl = `${baseUrl}${reactAppPath}`; // Store full URL
    tool.appType = 'react';
    await tool.save();
    res.json(withIframeUrl(tool));
  } catch (error) {
    if (error.message === "Only .zip files are allowed") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error uploading React app:", error);
    next(error);
  }
});

router.delete("/:id", async (req, res) => {
  const tool = await MiniToolDB.findOne({ id: req.params.id });

  if (!tool) {
    return res.status(404).json({ message: "Tool not found." });
  }

  // Delete associated zip file if it exists
  if (tool.reactAppZipPath) {
    try {
      await fs.unlink(tool.reactAppZipPath);
    } catch (err) {
      // Ignore if file doesn't exist
      console.warn(`Could not delete zip file: ${tool.reactAppZipPath}`);
    }
  }

  await MiniToolDB.findOneAndDelete({ id: req.params.id });

  res.status(204).send();
});

function isHasIndexHtmlExist(entries){
  return  entries.some(entry => {
    const name = entry.entryName.replace(/\\/g, "/");
    return name === "index.html" ||
        name.endsWith("/index.html") ||
        name === "dist/index.html" ||
        name.startsWith("dist/") && name.endsWith("/index.html");
  });
}
module.exports = router;

