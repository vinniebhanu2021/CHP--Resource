const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'resources.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read resources
function getResources() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading resources file:', err);
    return [];
  }
}

// Helper to save resources
function saveResources(resources) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(resources, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing resources file:', err);
    return false;
  }
}

// Health check endpoint for Render monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET all resources (with optional ?q= search filter and ?category= filter)
app.get('/api/resources', (req, res) => {
  let resources = getResources();
  const { q, category } = req.query;

  if (category && category !== 'All') {
    resources = resources.filter(r => r.category && r.category.toLowerCase() === category.toLowerCase());
  }

  if (q) {
    const query = q.toLowerCase();
    resources = resources.filter(r =>
      (r.title && r.title.toLowerCase().includes(query)) ||
      (r.subtitle && r.subtitle.toLowerCase().includes(query)) ||
      (r.category && r.category.toLowerCase().includes(query))
    );
  }

  res.json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// GET resource categories
app.get('/api/categories', (req, res) => {
  const resources = getResources();
  const categories = Array.from(new Set(resources.map(r => r.category || 'General'))).filter(Boolean);
  res.json({
    success: true,
    data: ['All', ...categories]
  });
});

// GET single resource by ID
app.get('/api/resources/:id', (req, res) => {
  const resources = getResources();
  const resource = resources.find(r => r.id === parseInt(req.params.id, 10));
  if (!resource) {
    return res.status(404).json({ success: false, error: 'Resource not found' });
  }
  res.json({ success: true, data: resource });
});

// POST add new resource
app.post('/api/resources', (req, res) => {
  const { title, subtitle, url, icon, category } = req.body;
  if (!title || !url) {
    return res.status(400).json({ success: false, error: 'Title and URL are required' });
  }

  const resources = getResources();
  const nextId = resources.length > 0 ? Math.max(...resources.map(r => r.id || 0)) + 1 : 1;

  const newResource = {
    id: nextId,
    title: title.trim(),
    subtitle: subtitle ? subtitle.trim() : '',
    icon: icon ? icon.trim() : '🔗',
    category: category ? category.trim() : 'General',
    url: url.trim()
  };

  resources.push(newResource);
  if (!saveResources(resources)) {
    return res.status(500).json({ success: false, error: 'Failed to persist resource' });
  }

  res.status(201).json({ success: true, data: newResource });
});

// Serve frontend for root or any unhandled route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CHP Resource Hub server running on port ${PORT}`);
});
