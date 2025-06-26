# Vercel Deployment Guide for AI Room Collaborator

This guide will help you deploy the frontend of AI Room Collaborator to Vercel successfully.

## 🚀 Quick Deployment

### 1. Prerequisites

- Vercel account (free tier available)
- GitHub repository connected to Vercel
- Backend API deployed and accessible

### 2. Environment Variables Setup

Before deploying, set up these environment variables in your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
REACT_APP_API_URL=https://your-backend-domain.com/api/v1
REACT_APP_WS_URL=wss://your-backend-domain.com/ws
REACT_APP_ENVIRONMENT=production
```

### 3. Deployment Steps

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod
```

#### Option B: Deploy via GitHub Integration

1. Connect your GitHub repository to Vercel
2. Set the **Framework Preset** to `Create React App`
3. Set the **Root Directory** to `frontend`
4. Set the **Build Command** to `npm run build`
5. Set the **Output Directory** to `build`
6. Deploy

### 4. Build Configuration

The project includes these files to ensure successful deployment:

- **`vercel.json`**: Vercel-specific configuration
- **`.npmrc`**: NPM configuration to resolve dependency conflicts
- **`package.json`**: Updated with compatible versions

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Dependency Resolution Errors

If you encounter dependency conflicts:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with legacy peer deps
npm install --legacy-peer-deps
```

#### 2. TypeScript Version Conflicts

The project uses TypeScript 4.9.5 to be compatible with react-scripts 5.0.1.

#### 3. Build Failures

If the build fails, check:

- Environment variables are properly set
- Backend API is accessible
- All dependencies are compatible

#### 4. Runtime Errors

Common runtime issues:

- **CORS errors**: Ensure backend CORS is configured for your Vercel domain
- **API connection errors**: Verify `REACT_APP_API_URL` is correct
- **WebSocket errors**: Ensure `REACT_APP_WS_URL` uses `wss://` for production

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API endpoint | `https://api.yourapp.com/api/v1` |
| `REACT_APP_WS_URL` | WebSocket endpoint | `wss://api.yourapp.com/ws` |
| `REACT_APP_ENVIRONMENT` | Environment mode | `production` |

## 🔒 Security Considerations

### CORS Configuration

Ensure your backend CORS settings include your Vercel domain:

```python
# In your backend CORS configuration
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-app.vercel.app",
    "https://your-custom-domain.com"
]
```

### Environment Variables

- Never commit sensitive environment variables to your repository
- Use Vercel's environment variable management
- Keep API keys secure

## 🚀 Performance Optimization

### Vercel-Specific Optimizations

1. **Automatic HTTPS**: Vercel provides SSL certificates automatically
2. **CDN**: Global CDN for static assets
3. **Edge Functions**: For serverless API routes
4. **Image Optimization**: Automatic image optimization

### Build Optimization

The project is configured for optimal builds:

- Tree shaking enabled
- Code splitting for routes
- Optimized bundle size
- Gzip compression

## 📊 Monitoring

### Vercel Analytics

Enable Vercel Analytics to monitor:

- Page views and user behavior
- Performance metrics
- Error tracking
- Real-time monitoring

### Custom Domain

To use a custom domain:

1. Add your domain in Vercel dashboard
2. Configure DNS records
3. Update environment variables with new domain
4. Update backend CORS settings

## 🔄 Continuous Deployment

### GitHub Integration

With GitHub integration, Vercel will:

- Automatically deploy on every push to main branch
- Create preview deployments for pull requests
- Rollback to previous versions if needed

### Deployment Hooks

You can set up deployment hooks to:

- Notify your team on successful deployments
- Trigger backend deployments
- Run post-deployment tests

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with production environment
4. Check backend connectivity
5. Review browser console for errors

## 📈 Scaling

Vercel automatically scales your application:

- **Hobby Plan**: 100GB bandwidth, 100 serverless function executions
- **Pro Plan**: 1TB bandwidth, 1000 serverless function executions
- **Enterprise Plan**: Custom limits and features

## 🔄 Updates

To update your deployment:

1. Push changes to your GitHub repository
2. Vercel will automatically rebuild and deploy
3. Monitor the deployment logs
4. Test the new deployment

## 📝 Notes

- The frontend is configured to work with the backend API
- WebSocket connections require secure connections in production
- All static assets are optimized for CDN delivery
- The build process is optimized for Vercel's infrastructure 