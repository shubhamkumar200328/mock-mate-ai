# Interview Flow Integration - Setup Guide

## Changes Made

### 1. **Agent Component** (`components/Agent.tsx`)

- ✅ Added `createVapiAssistantConfig` import to generate dynamic Vapi configs
- ✅ Added `transcript` state to capture all conversation messages
- ✅ Updated message handler to capture both transcripts and full message content
- ✅ Modified `startCall()` to create custom Vapi assistant when interview questions exist
- ✅ Updated `endCall()` to save transcript to `/api/feedback/create`

### 2. **Vapi Config Generator** (`lib/vapi.ts`) - NEW FILE

- ✅ `createVapiAssistantConfig()` function creates dynamic assistant config with interview questions
- ✅ System prompt instructs the assistant to:
  - Follow questions in order
  - Ask follow-up questions when needed
  - Maintain professional, conversational tone
  - Handle off-topic questions gracefully
  - Conclude the interview properly

### 3. **Feedback API Endpoint** (`app/api/feedback/create/route.ts`) - NEW FILE

- ✅ Receives interview transcript from Agent component
- ✅ Calls `createFeedback()` server action to generate feedback using Gemini AI
- ✅ Saves feedback to Firestore

## Flow Diagram

```
User Create Interview Form
         ↓
   Firebase saves interview with questions
         ↓
   User navigates to /interview/[id]
         ↓
   Agent component loads with questions
         ↓
   User clicks "Call" button
         ↓
   createVapiAssistantConfig() creates custom config with questions
         ↓
   Vapi starts with dynamic config
         ↓
   AI interviewer asks questions from Firebase
         ↓
   Transcript captured in real-time
         ↓
   User clicks "End"
         ↓
   Transcript saved to /api/feedback/create
         ↓
   Feedback generated with Gemini AI
         ↓
   User redirected to feedback page
```

## How It Works Now

### Interview Creation

1. User fills interview form with: role, level, type, techstack, questions count
2. Form submits to `/api/vapi/generate`
3. API (with fallback) generates interview questions
4. Interview document saved to Firebase

### Interview Execution

1. User navigates to `/interview/[id]`
2. Interview details loaded from Firebase
3. User clicks "Call" button
4. Agent passes questions to `createVapiAssistantConfig()`
5. Custom Vapi assistant created with interview questions in system prompt
6. AI asks questions and candidate responds
7. All messages captured in `transcript` state

### Feedback Generation

1. User clicks "End" button
2. Transcript sent to `/api/feedback/create`
3. Gemini AI analyzes transcript and generates feedback
4. Feedback saved to Firestore
5. User can view feedback page

## Key Features

✅ **Dynamic Questions**: Questions from Firebase passed to Vapi  
✅ **Transcript Capture**: All user and assistant messages captured  
✅ **Automatic Feedback**: Feedback generated from transcript  
✅ **Professional Flow**: Follow-up questions and natural conversation  
✅ **Graceful Ending**: Interview concludes with thank you message

## Testing Checklist

- [ ] Create interview → Questions saved to Firebase ✓
- [ ] Start interview → Custom Vapi config loads with questions
- [ ] Ask questions → AI asks from Firebase questions list
- [ ] Capture transcript → All messages recorded
- [ ] End interview → Transcript sent to API
- [ ] Generate feedback → Feedback saved to Firestore
- [ ] View feedback → Feedback page displays results

## Next Steps (Optional Enhancements)

1. **Add progress tracking** - Show which question N/5
2. **Add pause/resume** - Allow pausing between questions
3. **Custom role/level handling** - Pass role/level to system prompt
4. **Question difficulty** - Adjust follow-ups based on response quality
5. **Performance metrics** - Show real-time scoring
