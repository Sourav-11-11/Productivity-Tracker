# 🚀 LetsMakeIt - Productivity & Life Management Platform

A modern, full-stack productivity platform built with **React 19**, **TypeScript**, **Express.js**, and **MongoDB**. LetsMakeIt combines daily task planning, job application tracking, and note-taking with AI-powered insights.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production-brightgreen)

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Features

### 📅 **Today's Planner**
- Daily task planning with categorization (DSA, Placement, Personal)
- Real-time progress tracking with completion percentage
- Tomorrow's auto-migration system
- Daily notes logging
- Focus hour tracking

### 💼 **Job Application Tracker**
- Kanban-style pipeline: Applied → OA → Interview → Offer → Rejected
- Drag-and-drop task management
- Deadline parsing with urgency indicators (🔴 Red, 🟠 Orange, 🟡 Yellow)
- Status tracking and notes at each stage
- Persistent storage with localStorage + cloud sync

### 📝 **Notes & Documentation**
- Folder-based organization
- Rich HTML editor with formatting toolbar
  - **Text**: Bold, Italic, Headings (H1, H2)
  - **Blocks**: Bullet lists, code blocks
  - **Links**: Auto-open in new tab
- Real-time auto-save with debouncing (500ms)
- Global search across all notes
- Cloud synchronization (60s intervals)

### 📊 **Dashboard & Analytics**
- Real-time statistics
  - Daily completion percentage
  - Streak tracking (consecutive days)
  - Total focus hours
- Progress visualization with Recharts
- AI-powered insights and recommendations

### 🤖 **AI Integration**
- System analysis with OpenAI GPT
- Daily plan generation based on goals
- Personalized productivity recommendations

### 🔄 **Hybrid Sync Architecture**
- **Local-first**: Dexie IndexedDB for instant UI updates
- **Cloud-first**: MongoDB Atlas for data persistence
- Automatic 60-second background sync
- Conflict-free upserts with MongoDB

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     React Frontend (Vite @ :5173)       │
│  ┌─────────────────────────────────┐   │
│  │  7 Pages (Today, Jobs, Notes)   │   │
│  │  4 Zustand Stores (State)       │   │
│  │  Dexie IndexedDB (Local Cache)  │   │
│  └─────────────────────────────────┘   │
└──────────────┬────────────────────────┘
               │ REST API (JSON)
               │ (Vite Proxy :5000)
               │
┌──────────────▼────────────────────────┐
│    Express Backend (Node @ :5000)     │
│  ┌─────────────────────────────────┐  │
│  │  9 API Routes (/api/notes/**/)  │  │
│  │  2 AI Routes (/api/ai/**)       │  │
│  │  MongoDB Schemas (Folder, Note) │  │
│  │  OpenAI Integration             │  │
│  └─────────────────────────────────┘  │
└──────────────┬────────────────────────┘
               │
┌──────────────▼────────────────────────┐
│   MongoDB Atlas (Cloud Database)       │
│  ┌─────────────────────────────────┐  │
│  │  Folders Collection              │  │
│  │  Notes Collection                │  │
│  │  Indexes for fast queries        │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | Latest | Build tool & dev server |
| Zustand | Latest | State management |
| Dexie | Latest | IndexedDB wrapper |
| TailwindCSS | Latest | Styling |
| dnd-kit | Latest | Drag-and-drop |
| Recharts | Latest | Data visualization |
| lucide-react | Latest | SVG icons |
| OpenAI | Latest | AI API |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | 5.x | Web framework |
| Node.js | 18+ | Runtime |
| MongoDB | 7.x | Database |
| Mongoose | 9.3.3 | ODM |
| CORS | Latest | Cross-origin requests |
| dotenv | Latest | Environment variables |
| OpenAI | Latest | AI API |

---

## 📁 Project Structure

```
LetsMakeIt/
├── client/                          # React Frontend (Port 5173)
│   ├── src/
│   │   ├── pages/                   # 6 Route Pages
│   │   │   ├── Today.tsx            # Daily task planner
│   │   │   ├── JobTracker.tsx       # Kanban pipeline
│   │   │   ├── Notes.tsx            # Folder-based notes
│   │   │   ├── Dashboard.tsx        # Analytics dashboard
│   │   │   ├── Progress.tsx         # Progress visualization
│   │   │   └── Onboarding.tsx       # Setup wizard
│   │   │
│   │   ├── components/              # Reusable Components
│   │   │   ├── MainLayout.tsx       # Sidebar navigation
│   │   │   ├── RichTextEditor.tsx   # HTML editor
│   │   │   ├── CircularProgress.tsx # Progress ring
│   │   │   └── QuickTaskModal.tsx   # Task input
│   │   │
│   │   ├── store/                   # Zustand State Stores
│   │   │   ├── useStore.ts          # Task management
│   │   │   ├── useJobStore.ts       # Job tracker
│   │   │   ├── useNotesStore.ts     # Notes + sync
│   │   │   └── useOnboardingStore.ts # Preferences
│   │   │
│   │   ├── db/                      # Dexie Database
│   │   │   └── db.ts                # Schema & indexes
│   │   │
│   │   ├── App.tsx                  # Router & root
│   │   ├── main.tsx                 # Entry point
│   │   └── theme.ts                 # Design tokens
│   │
│   ├── vite.config.ts               # Vite configuration
│   ├── tsconfig.json                # TypeScript config
│   ├── package.json                 # Dependencies
│   └── index.html                   # HTML template
│
├── server/                          # Express Backend (Port 5000)
│   ├── src/
│   │   ├── routes/                  # API Endpoints
│   │   │   ├── notes.js             # CRUD for notes/folders
│   │   │   └── ai.js                # AI analysis & planning
│   │   │
│   │   ├── models/                  # MongoDB Schemas
│   │   │   ├── Folder.js            # Folder schema
│   │   │   └── Note.js              # Note schema
│   │   │
│   │   ├── services/                # Business Logic
│   │   │   └── aiService.js         # OpenAI integration
│   │   │
│   │   └── index.js                 # Server setup
│   │
│   ├── package.json                 # Dependencies
│   └── .env                         # Secrets (not in git)
│
├── .env                             # Root environment variables
├── package.json                     # Root scripts
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+
- **MongoDB Atlas** account ([Create free tier](https://www.mongodb.com/cloud/atlas))
- **OpenAI API** key ([Get key](https://platform.openai.com/api-keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/LetsMakeIt.git
   cd LetsMakeIt
   ```

2. **Setup Root Dependencies**
   ```bash
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Setup Backend**
   ```bash
   cd server
   npm install
   cd ..
   ```

5. **Configure Environment Variables**
   
   Create `.env` in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/letsmakeitdb
   
   # OpenAI
   OPENAI_API_KEY=sk-...your-key-here...
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

### Running the Application

```bash
# From root directory - starts both frontend and backend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

---

## 💻 Development

### Frontend Development
```bash
cd client
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run lint         # ESLint check
npm run preview      # Preview production build
```

### Backend Development
```bash
cd server
npm start            # Start Express server
npm run dev          # Start with nodemon (auto-reload)
```

### TypeScript Check
```bash
cd client
npx tsc --noEmit    # Type-check without emitting
```

### Testing
```bash
# Verification script (Python)
python test_app.py
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Notes Endpoints

#### 📨 Sync Notes to Cloud
```http
POST /notes/sync
Content-Type: application/json

{
  "folders": [{ "id": "string", "name": "string", "updatedAt": number }],
  "notes": [{ 
    "id": "string", 
    "folderId": "string", 
    "title": "string", 
    "content": "html", 
    "updatedAt": number 
  }]
}

Response: 201 Created
{
  "success": true,
  "folders": [...],
  "notes": [...]
}
```

#### 🔍 Fetch All Notes
```http
GET /notes/all

Response: 200 OK
{
  "folders": [...],
  "notes": [...]
}
```

#### ➕ Create Folder
```http
POST /notes/folders
Content-Type: application/json

{ "name": "Study Materials" }

Response: 201 Created
{ "_id": "...", "name": "...", "createdAt": "..." }
```

#### 🗑️ Delete Folder
```http
DELETE /notes/folders/:id

Response: 200 OK
```

#### ➕ Create Note
```http
POST /notes
Content-Type: application/json

{ "folderId": "...", "title": "...", "content": "<p>...</p>" }

Response: 201 Created
```

#### ✏️ Update Note
```http
PUT /notes/:id
Content-Type: application/json

{ "title": "New Title", "content": "<p>...</p>" }

Response: 200 OK
```

#### 🗑️ Delete Note
```http
DELETE /notes/:id

Response: 200 OK
```

### AI Endpoints

#### 🤖 Analyze Full System
```http
POST /ai/analyze-full
Content-Type: application/json

{
  "tasks": [...],
  "jobs": [...],
  "notes": "..."
}

Response: 200 OK
{
  "analysis": "AI-generated insights...",
  "recommendations": [...]
}
```

#### 📋 Generate Daily Plan
```http
POST /ai/generate-plan
Content-Type: application/json

{
  "goals": ["Goal 1", "Goal 2"],
  "availableTime": 8,
  "previousTasks": [...]
}

Response: 200 OK
{
  "plan": "Recommended plan...",
  "tasks": [...]
}
```

---

## 🗄️ Database Schema

### Folders Collection
```javascript
{
  _id: ObjectId,
  userId: String,
  name: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.folders.createIndex({ userId: 1 })
db.folders.createIndex({ userId: 1, name: 1 })
```

### Notes Collection
```javascript
{
  _id: ObjectId,
  userId: String,
  folderId: String,
  title: String,
  content: String (HTML),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.notes.createIndex({ userId: 1 })
db.notes.createIndex({ folderId: 1 })
db.notes.createIndex({ userId: 1, createdAt: -1 })
```

---

## 🔐 Environment Variables

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |

---

## 🌐 Deployment

### Deploy Frontend (Vercel)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect on Vercel**
   - Go to [Vercel](https://vercel.com/new)
   - Import your GitHub repository
   - Set root directory: `client`
   - Deploy!

### Deploy Backend (Railway/Render)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect on Railway/Render**
   - Create new service
   - Connect GitHub repo
   - Set root directory: `server`
   - Add environment variables
   - Deploy!

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Standards
- Use TypeScript instead of JavaScript
- Follow ESLint rules
- Write meaningful commit messages
- Test before submitting PR

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 📞 Support

For questions, issues, or suggestions:
- **Open an Issue**: [GitHub Issues](https://github.com/yourusername/LetsMakeIt/issues)
- **Email**: support@letsmakeitapp.com

---

## 🎯 Roadmap

- [ ] User authentication (JWT)
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Dark/Light theme toggle
- [ ] Advanced search with filters
- [ ] Export notes as PDF
- [ ] Calendar integration
- [ ] Slack integration

---

## 🙏 Acknowledgments

- Built with ❤️ using React, TypeScript, and Express.js
- Icons by [Lucide Icons](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)
- Thanks to all contributors!

---

**Made with ❤️ by Sourav** | [Follow on GitHub](https://github.com/yourusername)
