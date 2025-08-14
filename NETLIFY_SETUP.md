# Netlify Environment Variables Configuration

You need to set these environment variables in your Netlify site settings:

## Required Environment Variables

1. **MONGODB_URI** (Critical for authentication)
   - Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
   - Add: `MONGODB_URI=mongodb+srv://<username>:<password>@cluster.2r7xs.mongodb.net/runher`
   - Replace `<username>` and `<password>` with your actual MongoDB credentials

2. **JWT_SECRET** (Critical for authentication)
   - Add: `JWT_SECRET=your_super_secure_jwt_secret_key_here`
   - Use a strong, random string (at least 32 characters)

3. **NODE_ENV** (Recommended)
   - Add: `NODE_ENV=production`

## Optional Environment Variables (for additional features)

4. **EMAIL_SERVICE** (for password reset functionality)
   - Add: `EMAIL_SERVICE=gmail` (or your email service)

5. **EMAIL_USERNAME** (for password reset emails)
   - Add: `EMAIL_USERNAME=your_email@gmail.com`

6. **EMAIL_PASSWORD** (for password reset emails)
   - Add: `EMAIL_PASSWORD=your_app_password`

7. **EMAIL_FROM** (for password reset emails)
   - Add: `EMAIL_FROM=noreply@yourapp.com`

8. **FRONTEND_URL** (for CORS and email links)
   - Add: `FRONTEND_URL=https://your-netlify-site.netlify.app`

## How to Set Environment Variables in Netlify:

1. Go to your Netlify Dashboard
2. Click on your site
3. Go to Site Settings → Environment Variables
4. Click "Add Variable" for each one
5. After adding all variables, redeploy your site

## MongoDB Atlas Setup:

1. Go to MongoDB Atlas (https://cloud.mongodb.com)
2. Create a cluster if you haven't already
3. Go to Database Access and create a user
4. Go to Network Access and add 0.0.0.0/0 (allow from anywhere) for Netlify
5. Get your connection string from Database → Connect → Connect your application

## After Setting Environment Variables:

1. Go to Netlify Dashboard → Deploys
2. Click "Trigger deploy" → "Deploy site"
3. Wait for the deployment to complete
4. Test your authentication

## Troubleshooting:

If you still get authentication errors after setting these variables:
1. Check the Function logs in Netlify Dashboard → Functions → View logs
2. Ensure MongoDB URI is correct and accessible
3. Verify JWT_SECRET is set
4. Make sure all route files exist in your repository
