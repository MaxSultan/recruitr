# Deploying Recruitr to Render

This guide will walk you through deploying your Recruitr application to Render, a modern cloud platform that makes it easy to deploy web services and databases.

## Prerequisites

1. A GitHub account with your Recruitr repository
2. A Render account (sign up at [render.com](https://render.com))
3. Your application code pushed to GitHub

## Step 1: Prepare Your Repository

### 1.1 Create Environment Variables File
Create a `.env.example` file in your project root:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recruitr_development
DB_USER=postgres
DB_PASSWORD=your_password_here

# Test Database Configuration
DB_NAME_TEST=recruitr_test

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 1.2 Update package.json (if needed)
Ensure your `package.json` has the correct start script:
```json
{
  "scripts": {
    "start": "node app.js",
    "build": "npm install && npm run setup-db"
  }
}
```

### 1.3 Commit and Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 2: Create a PostgreSQL Database on Render

1. **Log into Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign in with your GitHub account

2. **Create a New Database**
   - Click "New +" → "PostgreSQL"
   - Choose a name: `recruitr-db`
   - Select the **Starter** plan (free tier)
   - Choose your region (closest to your users)
   - Click "Create Database"

3. **Note Database Credentials**
   - Wait for the database to be created
   - Copy the following information:
     - **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
     - **Port**: `5432`
     - **Database**: `recruitr_production`
     - **User**: `recruitr_user`
     - **Password**: `[generated password]`

## Step 3: Deploy Your Web Service

1. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `recruitr` repository

2. **Configure the Service**
   - **Name**: `recruitr-web`
   - **Environment**: `Node`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `npm install && npm run setup-db`
   - **Start Command**: `npm start`

3. **Set Environment Variables**
   Add the following environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=[your database host from step 2]
   DB_PORT=5432
   DB_NAME=[your database name from step 2]
   DB_USER=[your database user from step 2]
   DB_PASSWORD=[your database password from step 2]
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

## Step 4: Alternative - Using render.yaml (Recommended)

Instead of manually configuring, you can use the included `render.yaml` file:

1. **Ensure render.yaml is in your repository root**
2. **Create a Blueprint**
   - In Render dashboard, click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select your `recruitr` repository
   - Render will automatically detect the `render.yaml` file
   - Click "Apply" to create all services

This will automatically create both the database and web service with the correct configuration.

## Step 5: Verify Deployment

1. **Check Build Logs**
   - Go to your web service dashboard
   - Check the "Logs" tab for any build errors
   - Ensure the database setup completed successfully

2. **Test Your Application**
   - Visit your application URL (provided by Render)
   - Test the main functionality
   - Check that the database connection is working

3. **Monitor Performance**
   - Use Render's built-in monitoring
   - Check response times and error rates

## Step 6: Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to your web service settings
   - Click "Custom Domains"
   - Add your domain name
   - Follow the DNS configuration instructions

2. **SSL Certificate**
   - Render automatically provides SSL certificates
   - Your site will be available at `https://yourdomain.com`

## Environment-Specific Configuration

### Production Environment Variables
```
NODE_ENV=production
PORT=10000
DB_HOST=[render database host]
DB_PORT=5432
DB_NAME=[render database name]
DB_USER=[render database user]
DB_PASSWORD=[render database password]
```

### Development vs Production
- **Development**: Uses local PostgreSQL database
- **Production**: Uses Render's managed PostgreSQL database
- **Database migrations**: Run automatically during build process

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure build command is correct
   - Check for any missing environment variables

2. **Database Connection Issues**
   - Verify database credentials are correct
   - Ensure database is fully provisioned
   - Check that your app is using the production database config

3. **Application Not Starting**
   - Check start command in package.json
   - Verify PORT environment variable
   - Check application logs for errors

### Useful Commands

```bash
# Check application logs
# (Available in Render dashboard)

# Test database connection locally
npm run setup-db

# Run migrations manually (if needed)
npm run migrate
```

## Cost Considerations

### Free Tier Limits
- **Web Service**: 750 hours/month (free)
- **Database**: 1GB storage, 1GB RAM (free)
- **Bandwidth**: 100GB/month (free)

### Paid Plans
- **Starter**: $7/month for web service
- **Standard**: $25/month for database
- Consider upgrading if you need more resources

## Security Best Practices

1. **Environment Variables**
   - Never commit sensitive data to Git
   - Use Render's environment variable system
   - Rotate database passwords regularly

2. **Database Security**
   - Use Render's managed database (automatically secured)
   - Enable connection pooling if needed
   - Regular backups are included

3. **Application Security**
   - Keep dependencies updated
   - Use HTTPS (automatically provided by Render)
   - Implement proper error handling

## Monitoring and Maintenance

1. **Health Checks**
   - Render automatically monitors your service
   - Set up custom health check endpoints if needed

2. **Logs**
   - Access logs through Render dashboard
   - Set up log aggregation for production use

3. **Updates**
   - Push to your main branch to trigger automatic deployments
   - Test changes in a staging environment first

## Next Steps

1. **Set up CI/CD**: Configure automatic deployments from GitHub
2. **Add monitoring**: Set up external monitoring services
3. **Scale**: Upgrade plans as your application grows
4. **Backup**: Set up regular database backups
5. **Performance**: Monitor and optimize as needed

Your Recruitr application should now be successfully deployed on Render! 🚀
