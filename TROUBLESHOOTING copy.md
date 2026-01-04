# Server Error Troubleshooting Guide

If you're experiencing server errors, follow these steps to diagnose and fix the issue:

## ⚡ Quick Fix for Email Timeout Errors

If you're getting `connect ETIMEDOUT 74.125.130.108:465` (Gmail SMTP timeout):

**Option 1: Skip OTP for Development (Fastest Solution)**
Add this to your `.env` file:
```env
SKIP_OTP=true
```
Then restart your server. This will bypass email verification and allow direct login.

**Option 2: Check Your Internet Connection**
- The timeout is due to slow/unstable internet connection
- Try using a different network (mobile hotspot, different WiFi)
- The email service now retries 2 times automatically

**Option 3: Use the OTP from Console (Recommended if email fails)**
- The OTP is **ALWAYS** logged to your server console immediately after login attempt
- Look for a message like this in your server terminal:
  ```
  ============================================================
  📧 OTP CODE FOR LOGIN
     Email: your@email.com
     OTP: 123456
     Expires in: 10 minutes
  ============================================================
  ```
- Copy the OTP code and use it to login
- This works even if email sending fails or times out

**Option 4: Test Your Email Configuration**
Run this command to test if email is working:
```bash
node test-email.js
```
This will tell you if your email service is configured correctly.

## Step 1: Check Your .env File

Make sure you have a `.env` file in the root directory with the following variables:

```env
PORT=9358
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
MONGODB_URI=your_mongodb_connection_string_here
```

**Common Issues:**
- Missing `.env` file
- Incorrect MongoDB connection string
- Missing JWT_SECRET

## Step 2: Check MongoDB Connection

### If using MongoDB Atlas:
1. Verify your connection string is correct
2. Check if your IP address is whitelisted in MongoDB Atlas
3. Verify your MongoDB username and password are correct
4. Check if your cluster is running (not paused)

### If using Local MongoDB:
1. Make sure MongoDB service is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   ```
2. Verify MongoDB is listening on port 27017

## Step 3: Check Server Logs

When you start the server with `npm start`, look for these messages:

✅ **Good signs:**
- `✅ Connected to MongoDB successfully`
- `🏥 Healthcare API Server running on http://127.0.0.1:9358`

❌ **Error signs:**
- `❌ MongoDB connection failed!`
- `❌ ERROR: MONGODB_URI is not set`
- `❌ ERROR: JWT_SECRET is not set`

## Step 4: Common Error Messages and Solutions

### "MONGODB_URI is not set"
**Solution:** Create a `.env` file in the root directory with your MongoDB connection string.

### "MongoDB connection failed"
**Possible causes:**
1. **Slow internet connection** - The server now waits up to 30 seconds for connection
2. **Wrong connection string** - Double-check your MONGODB_URI
3. **IP not whitelisted** - Add your IP to MongoDB Atlas whitelist
4. **Wrong credentials** - Verify username and password
5. **MongoDB service not running** - Start MongoDB service (for local MongoDB)

### "Request timed out"
**Solution:** 
- Check your internet connection speed
- The client now waits 60 seconds for responses
- Try again after ensuring stable internet connection

### "Network error - Unable to reach server"
**Possible causes:**
1. Server is not running - Start server with `npm start`
2. Wrong API URL - Check `REACT_APP_API_URL` in `client/.env`
3. Firewall blocking connection
4. Server crashed - Check server logs

## Step 5: Test Server Health

Open your browser and go to:
```
http://localhost:9358/health
```

You should see:
```json
{
  "status": "Server is running",
  "port": "9358",
  "database": "connected"
}
```

If `database` shows `"disconnected"`, your MongoDB connection failed.

## Step 6: Check Port Availability

Make sure port 9358 is not already in use:

**Windows:**
```powershell
netstat -ano | findstr :9358
```

**Mac/Linux:**
```bash
lsof -i :9358
```

If the port is in use, either:
- Stop the other application using the port
- Change PORT in your `.env` file

## Step 7: Verify Dependencies

Make sure all dependencies are installed:

```bash
npm install
cd client
npm install
```

## Still Having Issues?

1. **Check the full error message** in your server console
2. **Check browser console** for client-side errors
3. **Verify your internet connection** - slow internet can cause timeouts
4. **Restart both server and client** after making changes

## Recent Improvements Made

The following improvements have been made to handle slow internet and common errors:

✅ **MongoDB Connection:**
- Increased timeout to 30 seconds for server selection
- Increased timeout to 30 seconds for connection establishment
- Increased socket timeout to 60 seconds

✅ **HTTP Server:**
- Increased server timeout to 5 minutes
- Extended keep-alive timeout
- Extended headers timeout

✅ **Client Requests:**
- Increased request timeout to 60 seconds
- Better error messages for timeout and network errors

✅ **Error Handling:**
- More detailed error logging
- Better error messages for common issues
- Environment variable validation

