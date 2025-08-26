# Google OAuth Setup Guide for Blue Ocean Export

## 🔧 Complete Setup Instructions

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable Google+ API**:

   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google OAuth2 API"

4. **Create OAuth 2.0 Credentials**:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/auth/google/callback`
     - For production: `https://yourdomain.com/auth/google/callback`

5. **Copy your credentials**:
   - Client ID: `your-client-id.apps.googleusercontent.com`
   - Client Secret: `your-client-secret`

### 2. Environment Variables Setup

Create a `.env.local` file in your project root with:

```env
# Required Google OAuth Variables
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Required JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Required Database
MONGODB_URI=mongodb://localhost:27017/blueocean

# Required for production
NODE_ENV=development
```

### 3. Verify Your Setup

1. **Check environment variables are loaded**:
   ```bash
   npm run dev
   ```
2. **Test the Google OAuth URL generation**:

   - Visit: `http://localhost:3000/api/v1/auth/google`
   - Should return a JSON with Google OAuth URL

3. **Test the complete flow**:
   - Go to login page: `http://localhost:3000/auth/login`
   - Click "Continue with Google"
   - Complete Google authentication
   - Should redirect back to your app

### 4. Common Issues & Solutions

#### Issue: "redirect_uri_mismatch" error

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches your `GOOGLE_REDIRECT_URI` environment variable.

#### Issue: "Invalid client" error

**Solution**: Double-check your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct.

#### Issue: User not created in database

**Solution**:

1. Check MongoDB connection
2. Check server logs for errors
3. Verify all environment variables are set

#### Issue: "Authorization code is required" error

**Solution**: The callback page is not receiving the code parameter. Check your redirect URI configuration.

### 5. Production Deployment

For production, update your environment variables:

```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
NODE_ENV=production
```

And add the production redirect URI to your Google Cloud Console OAuth settings.

### 6. Testing Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials configured
- [ ] Redirect URIs added to Google Console
- [ ] Environment variables set in `.env.local`
- [ ] MongoDB running and accessible
- [ ] JWT_SECRET is set
- [ ] Google OAuth URL generation works (`/api/v1/auth/google`)
- [ ] Login page Google button works
- [ ] Google authentication completes successfully
- [ ] User is created in database
- [ ] User is redirected back to app
- [ ] User session is established

### 7. Debug Mode

The Google OAuth API now includes detailed logging. Check your server console for:

- "Google OAuth POST request received"
- "Database connected successfully"
- "Authorization code received: Yes"
- "Google user data received"
- "Creating new user with Google data" or "Existing user found"
- "New user created with ID: ..."
- "Google OAuth flow completed successfully"

If any of these logs are missing, it indicates where the flow is failing.
