const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// On Vercel, the root directory is read-only. We copy the seed data to /tmp/ if needed.
const LOCAL_DATA_FILE = path.join(__dirname, 'data', 'resources.json');
const RUNTIME_DATA_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'resources.json')
  : LOCAL_DATA_FILE;

// Helper to get active file path and ensure initial data exists
function initDataFile() {
  try {
    if (process.env.VERCEL && !fs.existsSync(RUNTIME_DATA_FILE)) {
      if (fs.existsSync(LOCAL_DATA_FILE)) {
        fs.copyFileSync(LOCAL_DATA_FILE, RUNTIME_DATA_FILE);
      }
    }
  } catch (err) {
    console.warn('Could not initialize runtime data file:', err);
  }
}
initDataFile();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read resources
function getResources() {
  try {
    const targetFile = fs.existsSync(RUNTIME_DATA_FILE) ? RUNTIME_DATA_FILE : LOCAL_DATA_FILE;
    if (fs.existsSync(targetFile)) {
      const data = fs.readFileSync(targetFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading resources file:', err);
    return [];
  }
}

// Helper to save resources
function saveResources(resources) {
  try {
    // Attempt saving to runtime target (on Vercel, this is /tmp/resources.json)
    fs.writeFileSync(RUNTIME_DATA_FILE, JSON.stringify(resources, null, 2), 'utf8');
    
    // Also sync to local data directory if writable
    if (!process.env.VERCEL && RUNTIME_DATA_FILE !== LOCAL_DATA_FILE) {
      try {
        fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(resources, null, 2), 'utf8');
      } catch (_) {}
    }
    return true;
  } catch (err) {
    console.error('Error writing resources file:', err);
    return false;
  }
}

// Health check endpoint for Render/Vercel monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET all resources
app.get('/api/resources', (req, res) => {
  let resources = getResources();
  const { q } = req.query;

  if (q) {
    const query = q.toLowerCase();
    resources = resources.filter(r =>
      (r.title && r.title.toLowerCase().includes(query)) ||
      (r.subtitle && r.subtitle.toLowerCase().includes(query))
    );
  }

  res.json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// PUT /api/resources/:id - Update resource globally & publicly
app.put('/api/resources/:id', (req, res) => {
  const resourceId = parseInt(req.params.id, 10);
  const { title, subtitle, url, category } = req.body;

  if (!title || !url) {
    return res.status(400).json({ success: false, error: 'Title and URL are required' });
  }

  const resources = getResources();
  const index = resources.findIndex(r => r.id === resourceId);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Resource not found' });
  }

  // Update resource fields
  resources[index].title = title.trim();
  resources[index].subtitle = subtitle ? subtitle.trim() : '';
  resources[index].url = url.trim();
  if (category) {
    resources[index].category = category.trim();
  }

  if (!saveResources(resources)) {
    return res.status(500).json({ success: false, error: 'Failed to update resource file' });
  }

  res.json({
    success: true,
    data: resources[index]
  });
});

// Serve frontend for root or any unhandled route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export app for serverless platforms (like Vercel)
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CHP Resource Hub server running on port ${PORT}`);
  });
}
