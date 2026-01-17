# Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB >= 6.x (local or MongoDB Atlas)
- npm or yarn

### Installation

```bash
cd d:\sawari_backend
npm install
```

### Configuration

1. Environment variables are already set in `.env`
2. Update `MONGODB_URI` if using different MongoDB instance:
   ```
   MONGODB_URI=mongodb://localhost:27017/sawari
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sawari
   ```

### Run Development Server

```bash
npm run start:dev
```

Server will start on: `http://localhost:3000`

### Access Swagger Documentation

Open in browser: `http://localhost:3000/api/docs`

### Test Health Endpoint

```bash
curl http://localhost:3000/api/v1/health
```

## 📁 Project Structure

```
d:\sawari_backend/
├── src/
│   ├── common/              # Shared utilities
│   │   ├── filters/        # Exception filters
│   │   ├── exceptions/     # Custom exceptions
│   │   ├── logger/         # Winston logger
│   │   └── middleware/     # Request logger
│   ├── config/             # Configuration
│   ├── database/           # MongoDB setup
│   ├── health/             # Health check
│   ├── modules/            # Business logic (future)
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json            # Dependencies
└── README.md               # Documentation
```

## 🛠️ Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload

# Production
npm run build              # Build for production
npm run start:prod         # Run production build

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Test coverage
```

## 📝 What's Implemented

✅ **Configuration System** - Environment-based config  
✅ **Database** - MongoDB with Mongoose  
✅ **Logging** - Winston structured logging  
✅ **Exception Handling** - Standardized error responses  
✅ **Security** - Helmet, CORS, rate limiting  
✅ **Validation** - Global validation pipe  
✅ **API Versioning** - `/api/v1` prefix  
✅ **Health Checks** - `/api/v1/health` endpoint  
✅ **Documentation** - Swagger at `/api/docs`  

## 🔜 Next Steps (Step 2)

1. **Authentication Module**
   - User registration/login
   - JWT tokens
   - Password hashing

2. **User Management**
   - User profiles
   - Rider/Driver roles

3. **Ride Management**
   - Ride requests
   - Ride matching
   - Real-time tracking

## 💡 Tips

- All files have extensive comments explaining architecture decisions
- Check README.md files in each directory for guidance
- Swagger docs show all available endpoints
- Health endpoint useful for monitoring in production
- Environment variables control all configuration

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For local: `mongodb://localhost:27017/sawari`

**Port Already in Use:**
- Change `PORT` in `.env`
- Or kill process using port 3000

**Build Errors:**
- Run `npm install` to ensure all dependencies installed
- Check Node.js version >= 18.x
