# BookVision - AI-Powered Book Digitization Platform

## Project Overview
BookVision is a full-stack web application that converts smartphone videos of book pages into searchable PDFs with NFT ownership proof. Users record book pages by flipping through them, upload the video, and receive both an original scanned PDF and an OCR-enhanced searchable version.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Wouter (routing) + TailwindCSS
- **Backend**: Express.js + TypeScript
- **Authentication**: Firebase Authentication (Email/Password + Google OAuth)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Video Processing**: (Planned) fluent-ffmpeg for frame extraction
- **OCR**: (Planned) Tesseract.js or cloud OCR service
- **Styling**: Custom golden/dark theme with AI-inspired animations

## Current Implementation Status

### Phase 1: Frontend & Authentication ✅
- [x] Firebase configuration and authentication setup
- [x] Supabase client configuration
- [x] AuthContext provider with user state management
- [x] Database schemas (users_profile, documents tables)
- [x] Custom BookVision golden/dark theme CSS utilities
- [x] Core UI components:
  - Navbar with auth state
  - Footer
  - ParticleBackground (animated AI particles)
  - FloatingElements (geometric shapes)
- [x] Pages implemented:
  - Home/Landing page with hero section
  - Login page (Email + Google OAuth)
  - Signup page (Email + Google OAuth)
  - Dashboard page with upload interface
  - Pricing page
- [x] TypeScript types and Zod schemas in shared/schema.ts

### Phase 2: Backend API (TODO)
- [ ] Express routes for document management
- [ ] Video upload endpoint with multipart/form-data
- [ ] Supabase storage integration for video files
- [ ] Video processing pipeline:
  - [ ] Frame extraction (every 2 seconds using fluent-ffmpeg)
  - [ ] Page detection and deglaring
  - [ ] PDF generation (original)
  - [ ] OCR text layer generation
  - [ ] PDF generation (searchable)
- [ ] NFT minting integration (optional)
- [ ] Document status updates

### Phase 3: Integration & Testing (TODO)
- [ ] Connect frontend upload to backend API
- [ ] Real-time processing status updates
- [ ] PDF download functionality
- [ ] End-to-end testing
- [ ] Error handling and edge cases

## Database Schema

### users_profile
```sql
CREATE TABLE users_profile (
  id TEXT PRIMARY KEY,        -- Firebase UID
  email TEXT NOT NULL UNIQUE
);
```

### documents
```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users_profile(id),
  title TEXT NOT NULL,
  videoUrl TEXT,
  originalPdfUrl TEXT,
  ocrPdfUrl TEXT,
  nftTokenId TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables
Required secrets (already configured in Replit):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SESSION_SECRET`

## Design Guidelines
**CRITICAL**: The UI design is based on a provided Next.js static template and must be preserved exactly:
- Golden/dark color scheme (#d4af37, #f4d03f, #ffd700 gradients)
- AI-inspired particle animations and floating geometric elements
- Custom CSS utilities: `.text-gradient`, `.luxury-card`, `.luxury-card-premium`, `.ai-glow`, `.pulse-glow`, `.floating-element`
- Dark background (#0a0a0a to #1a1a1a gradient)
- Logo: 9.png (BookVision brand asset)

**DO NOT** modify the visual design, colors, or animations. Only add functional logic.

## Running the Project
```bash
npm run dev
```
The application runs on port 5000 with Vite HMR enabled.

## Key Features
1. **Video Upload**: Drag-and-drop or file picker for book page videos
2. **AI Processing**: Automatic frame extraction, page detection, glare removal
3. **Dual PDF Output**: Original scanned pages + OCR searchable version
4. **NFT Ownership**: (Future) Blockchain proof of digitization
5. **Firebase Auth**: Email/password and Google OAuth integration
6. **Dashboard**: View all digitized documents and download PDFs

## Next Steps (Phase 2 - Backend API)
1. **CRITICAL SECURITY**: Move user profile creation to backend endpoint that verifies Firebase ID token
   - Create POST /api/users/profile endpoint
   - Verify Firebase ID token on backend
   - Use Supabase service role (not anon key) for profile creation
   - Implement RLS policies in Supabase
2. Implement backend video upload endpoint
3. Set up Supabase storage buckets (videos and PDFs)
4. Integrate fluent-ffmpeg for video frame extraction
5. Implement OCR processing pipeline
6. Connect frontend upload to backend API
7. Add real-time processing status updates
8. Test end-to-end workflow

## Known Issues (To Address in Phase 2)
- **Security**: User profile creation currently happens from frontend using Supabase anon key. This must be moved to a backend endpoint that verifies Firebase ID tokens before writing to Supabase with a service role.
- **Data**: Document interface removed `createdAt` to keep minimal, but database has this field. Backend API will handle this field properly when fetching documents.
- **Auth**: AuthProvider has duplicative profile creation in both redirect handler and onAuthChange. This can be optimized.

## Notes
- Frontend UI is complete with BookVision golden/dark theme
- All pages have comprehensive data-testid attributes for e2e testing
- Protected routes implemented with useEffect to avoid render-time side effects
- Backend stubs are in place but need Phase 2 implementation
- Database tables need to be created in Supabase console
- Storage buckets need to be created in Supabase for videos and PDFs
