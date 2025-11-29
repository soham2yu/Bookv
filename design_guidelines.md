# BookVision Design Guidelines

## Design Approach: Preserve Existing UI

**Critical Directive**: The BookVision frontend UI is **complete and finalized**. All visual design, styling, layouts, and UI components must remain unchanged. These guidelines document preservation requirements, not new design decisions.

## Primary Constraint

**DO NOT MODIFY**:
- Visual designs or UI styling
- Component layouts or structures
- Color schemes, typography, or spacing
- Any CSS or styling code
- Existing page structures

**ONLY ADD**:
- Functional logic (authentication, API calls, state management)
- Route protection and redirects
- Context providers for auth state
- API integration code
- Database queries and mutations

## Implementation Guidelines

### Authentication Flow
- Integrate Firebase Auth without changing login/signup page designs
- Add invisible auth state listeners and context providers
- Implement redirect logic that preserves existing page transitions
- Maintain all existing form layouts, input styles, and button designs

### Dashboard Functionality
- Add video upload logic to existing upload UI components
- Integrate document listing with existing card/table layouts
- Connect download buttons to Supabase Storage without changing button styles
- Add loading states using existing component patterns
- Display status messages within current design framework

### Backend Integration
- Create Express.js backend separate from frontend styling
- API responses should populate existing UI components
- Error handling should use existing notification/alert designs
- Progress indicators should match current visual language

### Database Operations
- Execute Supabase queries behind existing UI components
- Populate document lists into existing layout structures
- User profile creation should be invisible to frontend design

## Key Principle

**Form Follows Function**: Every new functional element must adapt to the existing visual design system. The UI dictates the implementation, not the other way around. Analyze the existing components and ensure all new logic fits seamlessly within the established design patterns.