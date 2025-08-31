Max Solutions Platform

A full-stack web platform for engineering excellence and comprehensive testing, built with React.js + Node.js/Express + MongoDB Atlas + TailwindCSS.

🚀 Features

🔒 User Management: Registration, login, profile handling

📝 Test System: Communication, Quantitative, Technical, Interview

📅 Smart Scheduling: One attempt per test per week per student

📊 Real-time Dashboard: Live results & performance tracking

👨‍💻 Admin Control: Test creation, management, analytics

📱 Responsive Design: Mobile-friendly, fast UI

⚡ Quick Installation & Setup
1️⃣ Clone Repository
git clone <repository-url>
cd maxx

2️⃣ Install Dependencies
npm install         # Root dependencies
cd client && npm install
cd ..

3️⃣ Configure Environment
cp env.example .env


Update .env with your configuration:

PORT=5000
NODE_ENV=development
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:3000

4️⃣ Run Application
# Development (frontend + backend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client

# Production
npm start

🛠️ Tech Stack

Frontend: React 18, TailwindCSS, React Router, Axios

Backend: Node.js, Express.js, MongoDB Atlas, Mongoose

Authentication: JWT, bcryptjs

Utilities: Multer, CORS, React Hot Toast, Lucide React

🤝 Contributing

Fork the repository

Create a feature branch

Make your changes

Test thoroughly

Submit a pull request

📄 License

This project is licensed under the MIT License.
