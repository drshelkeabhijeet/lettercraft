# LetterCraft - Replit Agent Guidelines

## Overview

LetterCraft is a professional mobile application for generating official letters using AI-learned writing styles. The app targets universities, government offices, and corporate users who need to generate consistent, formal correspondence. Users can create style profiles by uploading sample letters, then use AI to generate new letters matching their established writing patterns. The app supports custom letterheads and PDF export functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (new architecture enabled)
- **Navigation**: React Navigation v7 with a hybrid structure:
  - Native Stack Navigator for root-level screens (Landing, Login, CreateProfile, PDFPreview)
  - Bottom Tab Navigator for authenticated screens (Generator, Profiles, Account)
- **State Management**: 
  - TanStack React Query for server state and API caching
  - React Context for authentication state
  - Local component state for UI interactions
- **Styling**: Theme-based design system with light/dark mode support using custom hooks
- **Animations**: React Native Reanimated for fluid UI animations
- **Local Storage**: AsyncStorage for persisting user data, profiles, and letterheads

### Backend Architecture
- **Runtime**: Express.js server running on Node.js with TypeScript
- **API Pattern**: RESTful API with `/api` prefix for all routes
- **Build Tool**: TSX for development, esbuild for production builds
- **CORS**: Dynamic origin handling supporting Replit domains and localhost development

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - contains shared type definitions
- **Migrations**: Drizzle Kit manages migrations in `/migrations` directory
- **Current Schema**: Users table with id, username, password fields
- **Note**: Currently using in-memory storage (`MemStorage`) as fallback - database connection requires `DATABASE_URL` environment variable

### Project Structure
```
client/           # React Native Expo application
  components/     # Reusable UI components (Button, Card, ThemedText, etc.)
  screens/        # Screen components (Generator, Login, Profiles, etc.)
  navigation/     # Navigator configurations
  hooks/          # Custom React hooks (useAuth, useTheme, useScreenOptions)
  lib/            # Utilities (query-client, storage)
  constants/      # Theme definitions and design tokens

server/           # Express backend
  index.ts        # Server entry point with CORS and middleware setup
  routes.ts       # API route definitions
  storage.ts      # Data persistence interface
  templates/      # HTML templates for web landing page

shared/           # Shared code between client and server
  schema.ts       # Drizzle schema and Zod validation
```

### Authentication Pattern
- Custom `AuthProvider` context wrapping the app
- Credentials persisted to AsyncStorage
- Navigation guards in `RootStackNavigator` redirect based on auth state
- Currently uses mock authentication - ready for real backend integration

### Design System
- Defined in `client/constants/theme.ts`
- Color tokens for light/dark modes with semantic naming
- Spacing scale (xs through 4xl)
- Typography presets (h1, h2, h3, body, caption, small, link)
- Border radius and shadow presets
- Uses SF Pro / system fonts via platform defaults

## External Dependencies

### Core Services
- **PostgreSQL Database**: Required for production data persistence. Set `DATABASE_URL` environment variable.
- **AI Service**: Not yet integrated - placeholder for letter generation AI (likely OpenAI or similar)

### Third-Party Libraries
- **Expo SDK**: Provides native capabilities (image picker, file system, sharing, haptics)
- **React Navigation**: Screen navigation and tab management
- **TanStack React Query**: API state management and caching
- **Drizzle ORM + Zod**: Database queries and schema validation
- **React Native Reanimated**: Animation engine
- **Expo Image**: Optimized image loading

### Build & Development
- **TSX**: TypeScript execution for development server
- **esbuild**: Production server bundling
- **Babel with module-resolver**: Path aliasing (@/ and @shared/)
- **ESLint + Prettier**: Code quality and formatting

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for DB features)
- `EXPO_PUBLIC_DOMAIN`: API server domain for client requests
- `REPLIT_DEV_DOMAIN`: Development domain for Expo
- `REPLIT_DOMAINS`: Comma-separated allowed CORS origins