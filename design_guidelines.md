# LetterCraft - Design Guidelines

## Brand Identity

**Purpose**: Professional letter generation app for universities, government offices, and corporate users requiring consistent, formal correspondence.

**Aesthetic Direction**: Editorial/Refined - Sophisticated typography, clean hierarchy, trustworthy and efficient. Think professional publishing meets modern productivity tools. The app should feel like a premium writing instrument, not a playful toy.

**Memorable Element**: Sophisticated document preview cards with subtle shadows and the AI-generated content feeling like premium paper stock.

## Navigation Architecture

**Root Navigation**: Tab Navigation (3 tabs)
- Home (letter generation)
- Profiles (style profile management)
- Account (settings, letterhead manager)

**Authentication**: Required - Apple Sign-In (iOS), Google Sign-In (Android)

**Screen List**:
1. Landing (Stack-only, pre-auth)
2. Login (Stack-only, pre-auth)
3. Home (Tab 1 - Main Generator)
4. Style Profiles List (Tab 2)
5. Create Style Profile (Modal from Tab 2)
6. Account/Settings (Tab 3)
7. PDF Preview (Native Modal)

## Screen-by-Screen Specifications

### 1. Landing Screen
- **Purpose**: Introduce the app and drive to signup
- **Layout**:
  - No header
  - Top inset: insets.top + Spacing.2xl
  - Bottom inset: insets.bottom + Spacing.xl
  - Scrollable root view
- **Components**:
  - App logo with tagline centered at top third
  - Three feature cards (stack vertically): "Style Profiles", "AI Generation", "Print Ready" with icons and brief descriptions
  - Large primary "Get Started" button at bottom
  - Spacing between elements: Spacing.2xl

### 2. Login Screen
- **Purpose**: User authentication
- **Layout**:
  - No header
  - Top inset: insets.top + Spacing.2xl
  - Centered content (not scrollable)
- **Components**:
  - Small app logo at top
  - Apple Sign-In button (iOS) / Google Sign-In button (Android)
  - "By signing in, you agree to..." text with links

### 3. Home Screen (Main Generator)
- **Purpose**: Generate letters using selected style profile
- **Layout**:
  - Transparent custom header with "LetterCraft" title, no buttons
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
  - Scrollable root view
- **Components**:
  - Style profile dropdown selector (full-width card)
  - Large multi-line text input for instructions (min 120px height)
  - "Generate Letter" primary button below input
  - Output preview card (appears after generation):
    - White card with A4 aspect ratio preview
    - Generated text in serif preview font
    - Action buttons row: Refine, Download TXT, Download PDF
  - Empty state (before generation): Illustration showing "Describe the letter you need"

### 4. Style Profiles List
- **Purpose**: View and manage writing style profiles
- **Layout**:
  - Default header with "Style Profiles" title
  - Right header button: "+" (create new)
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
  - FlatList root view
- **Components**:
  - List of profile cards, each showing:
    - Profile name (bold)
    - Description (2 lines max)
    - Created date (small, muted)
    - Swipe actions: Select, Delete
  - Empty state: Illustration with "Create your first style profile"

### 5. Create Style Profile (Modal)
- **Purpose**: Upload samples and create new writing style
- **Layout**:
  - Default modal header with "New Style Profile" title
  - Left button: Cancel, Right button: Save (disabled until valid)
  - Scrollable form root view
  - Top/bottom insets: Spacing.xl
- **Components**:
  - Text input: Profile name (required)
  - Text area: Description (optional, 3 lines)
  - File upload section:
    - "Take Photo" button (camera icon)
    - "Choose Files" button (document icon)
    - Grid of uploaded file thumbnails (3 columns)
    - Helper text: "Upload 3-6 sample letters"
  - Loading overlay appears during analysis

### 6. Account/Settings
- **Purpose**: User preferences and letterhead management
- **Layout**:
  - Default header: "Account"
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
  - Scrollable root view
- **Components**:
  - User info card (avatar, name, email)
  - "Letterhead Manager" section:
    - Grid of letterhead thumbnails (2 columns)
    - "Upload New Letterhead" button
    - Each letterhead shows name and delete icon
  - Settings section: Theme toggle, Notifications
  - "Log Out" button (secondary style)
  - "Delete Account" nested under Settings (confirmation alert)

### 7. PDF Preview (Modal)
- **Purpose**: Full-screen PDF preview before download
- **Layout**:
  - Custom header with "Preview" title
  - Left button: Close, Right button: Download
  - Full-screen PDF viewer
- **Components**:
  - Native PDF viewer component
  - Download floating button at bottom

## Color Palette

- **Primary**: #1E3A8A (Deep Professional Blue)
- **Accent**: #D97706 (Warm Amber - for highlights)
- **Background**: #F9FAFB (Soft Gray)
- **Surface**: #FFFFFF (Cards, inputs)
- **Text Primary**: #1F2937 (Near Black)
- **Text Secondary**: #6B7280 (Medium Gray)
- **Text Muted**: #9CA3AF (Light Gray)
- **Border**: #E5E7EB (Subtle Gray)
- **Success**: #059669 (Green)
- **Error**: #DC2626 (Red)

## Typography

- **Font**: Google Font "Lora" (serif) for headings and letter previews, System font (SF Pro/Roboto) for UI
- **Scale**:
  - H1: Lora, 28px, Bold (Landing headline)
  - H2: System, 22px, Semibold (Screen titles)
  - H3: System, 18px, Semibold (Section headers)
  - Body: System, 16px, Regular (Primary text)
  - Caption: System, 14px, Regular (Metadata)
  - Small: System, 12px, Regular (Helper text)
  - Letter Preview: Lora, 14px, Regular

## Visual Design

- Card shadows: shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3
- Floating button shadow: shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- Border radius: 12px for cards, 8px for buttons/inputs
- Button press feedback: reduce opacity to 0.7
- Icons: Feather icons from @expo/vector-icons

## Assets to Generate

1. **icon.png** - App icon featuring stylized pen nib in Primary color on white background - WHERE USED: Device home screen
2. **splash-icon.png** - Same as icon.png - WHERE USED: Launch screen
3. **landing-feature-1.png** - Simple illustration of document with sparkles (style profiles) - WHERE USED: Landing screen feature card 1
4. **landing-feature-2.png** - Abstract AI brain icon with document - WHERE USED: Landing screen feature card 2
5. **landing-feature-3.png** - PDF document with checkmark - WHERE USED: Landing screen feature card 3
6. **empty-generator.png** - Illustration of blank document with pencil - WHERE USED: Home screen empty state (before generation)
7. **empty-profiles.png** - Illustration of empty folder with "+" symbol - WHERE USED: Style Profiles empty state
8. **empty-letterheads.png** - Illustration of document header outline - WHERE USED: Account screen letterhead section empty state
9. **avatar-default.png** - Professional user silhouette in Primary color circle - WHERE USED: Account screen user profile

All illustrations should use Primary and Accent colors with clean lines and minimal detail.