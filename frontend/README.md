# Cycle Compass

<div align="left">
  <h3>🌙 A privacy-first, AI-powered menstrual cycle companion</h3>
  <p>Track, understand, and get personalized insights about your menstrual health with Cycle Compass.</p>
</div>

## ✨ Features

- **Smart Cycle Tracking** - Log symptoms, moods, and flow with an intuitive interface
- **AI-Powered Insights** - Get personalized explanations about your cycle patterns
- **Partner Sharing** - Securely share relevant cycle information with trusted partners
- **Privacy-First** - End-to-end encryption and granular consent controls
- **Myth-Busting** - Evidence-based information about menstrual health
- **Admin Dashboard** - Comprehensive admin interface for user management and analytics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Supabase account (for authentication and database)
- Google Cloud account (for Gemini AI integration)

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kushagra-webhook/cycle-compass.git
   cd cycle-compass/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `frontend` directory with:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:3001 # or your backend URL
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at `http://localhost:5173`

### Backend Setup

1. **Navigate to the backend directory**
   ```bash
   cd ../backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   NODE_ENV=development
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE=your_supabase_service_role
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The API will be available at `http://localhost:3001`

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: React Query + Zustand
- **Form Handling**: React Hook Form + Zod
- **Routing**: React Router
- **Authentication**: Supabase Auth
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js + Express
- **Database**: Supabase (PostgreSQL) with direct client access
- **AI**: Google Gemini
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

## 📱 Screenshots

*(gonna add screenshots)*

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
