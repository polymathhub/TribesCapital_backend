# Tribes Capital Frontend

Professional React frontend for the Tribes Capital platform - a unified ecosystem for clean energy investment, learning, and community.

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios API client with interceptors
│   │   └── endpoints.js       # API endpoint definitions
│   ├── components/
│   │   ├── Icon.jsx           # Reusable icon component
│   │   ├── CourseCard.jsx     # Course card component
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   └── TutorialOverlay.jsx # Onboarding tutorial
│   ├── constants/
│   │   └── colors.js          # Design token colors
│   ├── pages/
│   │   ├── HomePage.jsx       # Main home page
│   │   ├── AuthPage.jsx       # Authentication pages
│   │   ├── LearningHub.jsx    # Learning system UI
│   │   └── OfficeHoursEvents.jsx # Events page
│   ├── App.jsx                # Root app component
│   ├── App.css                # App styles
│   ├── main.jsx               # Vite entry point
│   └── index.css              # Global styles
├── index.html                 # HTML entry point
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies
└── .env.example               # Environment variables template
```

## Features

- **Modular Architecture**: Organized component and page structure
- **API Integration**: Pre-configured Axios client with JWT authentication
- **Design System**: Consistent color tokens and component styling
- **Responsive UI**: Mobile-first design approach
- **Interactive Components**: Tutorials, navigation, course cards

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Server runs on `http://localhost:5173` with hot module reloading.

## Build

```bash
npm run build
```

Optimized production build in `dist/` directory.

## API Integration

The frontend connects to the NestJS backend API at `http://localhost:3000/api`. Configure via `VITE_API_URL` environment variable.

### API Client Usage

```javascript
import { coursesAPI, eventsAPI, authAPI } from '@/api/endpoints';

// Fetch courses
const courses = await coursesAPI.list({ page: 1 });

// Get user profile
const profile = await usersAPI.getProfile();

// RSVP to event
await eventsAPI.rsvp(eventId);
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Tribes Capital
```

## Component Guidelines

- All components use functional React with hooks
- Style using inline objects with design token colors
- Props destructuring for clarity
- Clear prop documentation
