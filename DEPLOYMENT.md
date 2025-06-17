# Deployment Guide

## Vercel Deployment (Frontend)

### Prerequisites
- GitHub repository connected to Vercel
- Vercel account

### Steps

1. **Connect Repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `VeeramRoshanReddy/AI_Room_Collaborator`

2. **Configure Build Settings**
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add these environment variables in the Vercel dashboard:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=290635245122-a60ie2u5b8ga1lklu79tktgecs3s7l6c.apps.googleusercontent.com
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Troubleshooting

If you encounter the "react-scripts: command not found" error:

1. **Check package.json**: Ensure `react-scripts` is in the dependencies
2. **Clear Vercel Cache**: Go to Project Settings → General → Clear Build Cache
3. **Check Build Logs**: Verify the build command is running from the correct directory

### Alternative Configuration

If the automatic detection doesn't work, you can manually configure the build settings:

- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `cd frontend && npm install`

## Backend Deployment

### Railway (Recommended)

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` directory

2. **Environment Variables**
   Add these environment variables:
   ```
   DATABASE_URL=your_postgresql_url
   MONGODB_URL=your_mongodb_url
   SECRET_KEY=your_secret_key
   FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

3. **Deploy**
   - Railway will automatically detect FastAPI and deploy

### Heroku

1. **Create Procfile**
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. **Set Buildpacks**
   - Go to Settings → Buildpacks
   - Add: `heroku/python`

3. **Environment Variables**
   - Go to Settings → Config Vars
   - Add all required environment variables

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Post-Deployment

1. **Update Frontend API URL**
   - Update `REACT_APP_API_URL` in Vercel environment variables
   - Point to your deployed backend URL

2. **Test Application**
   - Verify authentication works
   - Test real-time features
   - Check file upload functionality

3. **Monitor Logs**
   - Check Vercel function logs for frontend issues
   - Monitor backend logs for API issues

## Common Issues

### Build Failures
- **Node version**: Ensure Node.js 16+ is used
- **Dependencies**: Check if all dependencies are properly installed
- **Environment variables**: Verify all required variables are set

### Runtime Errors
- **CORS issues**: Configure CORS in backend for frontend domain
- **Authentication**: Ensure Google OAuth is configured for production domain
- **Database connections**: Verify database URLs are accessible

### Performance
- **Build optimization**: Enable Vercel's build optimization features
- **Caching**: Configure proper caching headers
- **CDN**: Vercel automatically provides global CDN 