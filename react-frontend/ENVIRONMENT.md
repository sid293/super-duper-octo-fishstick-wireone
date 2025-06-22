# Environment Configuration

This project uses environment variables to configure the backend URL for different deployment scenarios.

## Environment Files

### Development (.env)
```
VITE_BACKEND_URL=http://localhost:3000
```

### Production - Render (.env.production)
```
VITE_BACKEND_URL=https://your-render-backend-url.onrender.com
```

### Production - Vercel (.env.vercel)
```
VITE_BACKEND_URL=https://your-vercel-backend-url.vercel.app
```

## How to Use

### Local Development
1. The `.env` file is automatically loaded when you run `npm run dev`
2. The backend should be running on `http://localhost:3000`

### Deploying to Render
1. Set the environment variable in your Render dashboard:
   - Go to your service settings
   - Add environment variable: `VITE_BACKEND_URL=https://your-backend-url.onrender.com`
2. Or use the `.env.production` file during build

### Deploying to Vercel
1. Set the environment variable in your Vercel dashboard:
   - Go to your project settings
   - Add environment variable: `VITE_BACKEND_URL=https://your-backend-url.vercel.app`
2. Or use the `.env.vercel` file during build

## API Configuration

The application now uses a centralized API utility (`src/utils/api.js`) that:
- Automatically uses the environment variable for the backend URL
- Handles all API calls consistently
- Provides better error handling
- Makes it easy to switch between development and production backends

## Important Notes

- Environment variables in Vite must be prefixed with `VITE_` to be accessible in the browser
- The proxy configuration in `vite.config.js` is still used for local development
- For production, the API calls go directly to the backend URL specified in the environment variable 