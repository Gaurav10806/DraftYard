
# 🚀 DraftYard

> **AI-Powered Collaborative Platform for Reviving Startup Ideas**

DraftYard is an AI-powered collaborative platform that helps developers validate new ideas, revive unfinished projects, discover similar work, and collaborate with other builders. It combines Hybrid Retrieval (RAG), Sentence Transformers, Google Gemini AI, and community collaboration.

---

## ✨ Key Features

### 🤖 AI-Powered Idea Review
- Feasibility analysis
- Market potential assessment
- Risk identification
- AI recommendations
- Tech stack suggestions

### 🔍 Hybrid Semantic Retrieval
- Sentence Transformer embeddings
- Semantic similarity search
- Metadata-aware re-ranking
- Similar project discovery

### 👥 Community Collaboration
- Revive abandoned projects
- Join teams
- Community feed
- Collaboration requests

### 📂 Draft Workspace
- Tasks & milestones
- Team management
- Progress tracking

### 📊 Intelligent Insights
- Stack Intelligence
- AI Assistant
- Analytics

### 🔐 Authentication
- JWT Authentication
- Google OAuth 2.0

---

# 🏗️ Architecture

```text
React + TanStack Start
        │
        ▼
 Node.js + Express API
        │
 ┌──────┴────────┐
 ▼               ▼
MongoDB     Django ML Backend
                   │
     Hybrid Retrieval Engine
                   │
        Google Gemini API
                   │
          AI Idea Analysis
```

---

# 🧠 AI Workflow

1. User submits an idea.
2. Embeddings are generated.
3. Hybrid Retrieval finds similar drafts.
4. Metadata-aware re-ranking improves results.
5. Gemini performs AI analysis.
6. Structured response is returned.

---

# 🛠️ Tech Stack

**Frontend**
- React 19
- TypeScript
- TanStack Start
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- Django
- Django REST Framework

**Database**
- MongoDB
- Mongoose

**AI & ML**
- Google Gemini API
- Sentence Transformers
- Hybrid RAG Retrieval
- AI Idea Analysis

**Authentication**
- JWT
- Google OAuth 2.0

---

# 📁 Project Structure

```text
DraftYard/
├── client/
├── server/
├── ml-backend/
├── docs/
└── README.md
```

---

# ⚙️ Installation

```bash
git clone https://github.com/<your-username>/DraftYard.git
cd DraftYard
```

Frontend

```bash
cd client
npm install
npm run dev
```

Backend

```bash
cd server
npm install
npm run dev
```

ML Backend

```bash
cd ml-backend
pip install -r requirements.txt
python manage.py runserver
```

---

# 🔑 Environment Variables

## Server

```env
PORT=
MONGO_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

## ML Backend

```env
GEMINI_API_KEY=
MONGODB_URI=
```

---

# 📸 Screenshots

- Landing Page
- Dashboard
- AI Idea Review
- Community Feed
- Draft Workspace
- Stack Intelligence
- Admin Dashboard

---

# 🚀 Future Scope

- GitHub Repository Integration
- AI Contributor Matching
- Advanced Project Analytics
- Mobile Application
- Mentor & Investor Discovery
- Multi-language Support

---

# 👥 Team

- Gaurav Soni
- Het Bhikadiya
- Parth Vaghela

---

# 📄 License

Developed for educational and academic purposes.

⭐ If you like this project, give it a star on GitHub!
