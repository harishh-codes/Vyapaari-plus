# Vyapaari+ Deployment Guide for Render

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Your database is already set up
4. **Cloudinary**: Your image storage is already configured

## Step 1: Prepare Your Repository

1. Make sure your repository structure looks like this:
   ```
   vyapaari-plus/
   ├── backend/
   │   ├── package.json
   │   ├── server.js
   │   ├── config.env
   │   └── ...
   ├── frontend/
   │   ├── package.json
   │   ├── vite.config.js
   │   └── ...
   └── render.yaml
   ```

2. Commit and push all changes to GitHub:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Connect Repository**:
   - Go to [render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables**:
   - In the Render dashboard, go to your backend service
   - Navigate to "Environment" tab
   - Add these environment variables:

   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://harishmchoudhary12:vfnBCr0jx9xmPMhW@vyaapari-plus.st6cgea.mongodb.net/vyaapari-plus?retryWrites=true&w=majority
   JWT_SECRET=ssndisoiwnlkNLKNAKJNOfnokfnsKPKNsnfsnsdknkNKdnajNJKFNSJKAJKJK
   CLOUDINARY_CLOUD_NAME=dhcndfbii
   CLOUDINARY_API_KEY=662182432787888
   CLOUDINARY_API_SECRET=LLS7PTrLqSdo_L9MXgxFSCKygE0
   ```

3. **Deploy**:
   - Render will automatically build and deploy both services
   - Backend will be available at: `https://vyapaari-backend.onrender.com`
   - Frontend will be available at: `https://vyapaari-frontend.onrender.com`

### Option B: Manual Deployment

If you prefer to deploy services manually:

#### Backend Service
1. Go to Render Dashboard → "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vyapaari-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (root)

#### Frontend Service
1. Go to Render Dashboard → "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `vyapaari-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Root Directory**: Leave empty (root)

## Step 3: Environment Variables Setup

### Backend Environment Variables
Add these in your backend service settings:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://harishmchoudhary12:vfnBCr0jx9xmPMhW@vyaapari-plus.st6cgea.mongodb.net/vyaapari-plus?retryWrites=true&w=majority` |
| `JWT_SECRET` | `ssndisoiwnlkNLKNAKJNOfnokfnsKPKNsnfsnsdknkNKdnajNJKFNSJKAJKJK` |
| `CLOUDINARY_CLOUD_NAME` | `dhcndfbii` |
| `CLOUDINARY_API_KEY` | `662182432787888` |
| `CLOUDINARY_API_SECRET` | `LLS7PTrLqSdo_L9MXgxFSCKygE0` |

### Frontend Environment Variables
Add these in your frontend service settings:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://vyapaari-backend.onrender.com/api` |
| `VITE_APP_NAME` | `Vyapaari+` |

## Step 4: Verify Deployment

1. **Backend Health Check**:
   - Visit: `https://vyapaari-backend.onrender.com/api/health`
   - Should return: `{"status":"OK","message":"Vyapaari+ Backend is running"}`

2. **Frontend**:
   - Visit: `https://vyapaari-frontend.onrender.com`
   - Should load your Vyapaari+ application

3. **Test Features**:
   - Try logging in with phone number and OTP (123456)
   - Test vendor and supplier flows
   - Verify image uploads work

## Step 5: Custom Domain (Optional)

1. **Add Custom Domain**:
   - In Render dashboard, go to your frontend service
   - Click "Settings" → "Custom Domains"
   - Add your domain (e.g., `vyapaari-plus.com`)

2. **Update CORS**:
   - Add your custom domain to the CORS origins in `backend/server.js`
   - Redeploy the backend service

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **Environment Variables**:
   - Double-check all environment variables are set correctly
   - Ensure no extra spaces or quotes

3. **CORS Errors**:
   - Verify frontend URL is in backend CORS origins
   - Check browser console for CORS errors

4. **Database Connection**:
   - Ensure MongoDB Atlas IP whitelist includes Render's IPs
   - Check MongoDB connection string format

### Useful Commands

```bash
# Check deployment status
curl https://vyapaari-backend.onrender.com/api/health

# View logs in Render dashboard
# Go to your service → "Logs" tab
```

## Security Notes

1. **Environment Variables**: Never commit sensitive data to Git
2. **JWT Secret**: Use a strong, unique secret in production
3. **MongoDB**: Ensure your database has proper security settings
4. **CORS**: Only allow necessary origins

## Performance Optimization

1. **Enable Auto-Deploy**: Set up automatic deployments on Git push
2. **Monitor Usage**: Keep track of Render's free tier limits
3. **Caching**: Consider adding Redis for session storage
4. **CDN**: Use Cloudinary's CDN for optimized image delivery

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Status**: [status.render.com](https://status.render.com)
- **Community**: [Render Community](https://community.render.com)

---

Your Vyapaari+ application should now be live and accessible to users worldwide! 🚀 