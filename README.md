# CHP Resource Hub

A unified web platform and centralized resource portal for Community Health & Prevention (CHP). Built with a Node.js / Express backend and a responsive frontend interface.

## Features
- **Dynamic Resource Directory**: Real-time listing of essential CHP links, tools, inventories, documents, and credentials.
- **RESTful Backend API**:
  - `GET /api/resources` - Retrieve all resources with support for query filters (`?q=`, `?category=`).
  - `GET /api/resources/:id` - Fetch single resource details.
  - `POST /api/resources` - Add new resource links with persistent storage.
  - `GET /api/categories` - Fetch available resource categories.
  - `GET /api/health` - Health check endpoint for zero-downtime monitoring on Render.
- **Interactive UI**:
  - Instant live search by keyword, title, and description.
  - Interactive category filtering chips.
  - Modal form to add custom resources dynamically.
  - Polished modern aesthetic matching CHP branding.

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

## Deploying to Render

This repository is ready for 1-click deployment on [Render](https://render.com):

1. Go to your Render Dashboard and click **New + > Web Service**.
2. Connect this repository: `https://github.com/vinniebhanu2021/CHP--Resource`.
3. Configure the service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Click **Deploy Web Service**.
