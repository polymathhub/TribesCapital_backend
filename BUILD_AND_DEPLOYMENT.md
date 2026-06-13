# Build and Deployment Configuration for TribesCapital

## Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- PostgreSQL database
- Environment variables properly configured

## Development Setup

### 1. Frontend Development Server

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Frontend will be available at: http://localhost:5173
# API requests proxy to: http://localhost:3000/api
```

### 2. Backend Development Server

```bash
# Install backend dependencies
npm install

# Start development server (with watch mode)
npm run start:dev

# Backend will be available at: http://localhost:3000
```

## Production Build & Deployment

### Build for Production

```bash
# From project root directory
npm run build

# This will:
# 1. Build the backend with: npm run build:backend
# 2. Build the frontend and place in dist/frontend with: npm run build:frontend

# Result structure:
# dist/
#   ├── main.js (compiled backend)
#   ├── main.js.map
#   └── frontend/
#       ├── index.html
#       ├── js/
#       │   ├── main-*.js
#       │   └── vendor-*.js
#       └── assets/

# Total estimated build time: 2-3 minutes
```

### Start Production Server

```bash
# From project root directory
npm run start:prod

# Backend serves:
# - API routes at: http://localhost:3000/api
# - Frontend static files at: http://localhost:3000/
# All requests to non-API routes are handled by React Router

# Verify deployment:
# - Open browser: http://localhost:3000
# - You should see the TribesCapital application
# - Check browser console for any errors
```

## Deployment Checklist

- [ ] Environment variables configured (.env, .env.local)
- [ ] Database migrations applied: `npm run db:push`
- [ ] Frontend built: `npm run build:frontend`
- [ ] Backend built: `npm run build:backend`
- [ ] Production server started: `npm run start:prod`
- [ ] Frontend displays correctly at root URL
- [ ] API calls work from frontend
- [ ] Database connections established
- [ ] Mobile responsive design verified on multiple devices

## Mobile-First Responsive Features

The application now includes:

✅ **Mobile-First CSS Architecture**
- Base styles optimized for 320px width screens
- Progressive enhancement for larger screens
- Media query breakpoints:
  - 320px-639px: Mobile phones
  - 640px-767px: Landscape phones
  - 768px-1023px: Tablets
  - 1024px-1279px: Small desktops
  - 1280px+: Large desktops

✅ **Responsive Components**
- Hamburger navigation menu for mobile
- Sidebar hides on mobile, shows on tablet+
- Flexible grid layouts
- Touch-friendly button sizes (44x44px minimum)

✅ **Mobile Optimizations**
- Viewport meta tags configured
- Input font-size 16px (prevents iOS zoom)
- Smooth scroll behavior
- Safe area support for notched devices
- Optimized animations for reduced motion

✅ **Performance**
- Code splitting with vendor bundles
- Asset minification
- Source map disabled in production
- Lazy loading support

## Troubleshooting

### Frontend not displaying

1. Check if build created `/dist/frontend/index.html`:
   ```bash
   ls -la dist/frontend/
   ```

2. Verify ServeStaticModule path in `src/app.module.ts`:
   ```typescript
   rootPath: join(__dirname, '..', 'dist', 'frontend')
   ```

3. Check backend logs for static file serving:
   ```bash
   npm run start:prod 2>&1 | grep -i "static\|serve"
   ```

### API calls failing

1. Verify CORS is enabled in `src/main.ts`
2. Check if frontend requests include `/api` prefix
3. Verify backend is listening on port 3000
4. Check network tab in DevTools for failed requests

### Responsive layout issues

1. Clear browser cache and hard refresh
2. Check responsive CSS media queries in DevTools
3. Test on actual mobile device or use DevTools device emulation
4. Verify viewport meta tag in `frontend/index.html`

## Additional Resources

- [Mobile-First Design Pattern](https://www.freecodecamp.org/news/mobile-first-design-explained/)
- [CSS Media Queries Best Practices](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [NestJS Serve Static Module](https://docs.nestjs.com/techniques/serving-static)
- [React Router Deployment](https://reactrouter.com/en/main/guides/ssr)
