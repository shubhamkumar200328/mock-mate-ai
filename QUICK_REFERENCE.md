# Quick Reference Guide

## Interview System Architecture

### 1. INTERVIEW CREATION

User Flow:

```
/interview page
→ InterviewForm component
→ Submit button clicked
→ POST /api/vapi/generate
→ Questions generated (Gemini or mock fallback)
→ Interview saved to Firebase
→ Redirect to / (home)
```

Frontend: `components/InterviewForm.tsx`

```typescript
const handleSubmit = async (values) => {
  const response = await fetch('/api/vapi/generate', {
    method: 'POST',
    body: JSON.stringify({ ...values, userid: userId }),
  });
  const data = await response.json();
  router.push('/'); // Interview created, go home
};
```

Backend: `app/api/vapi/generate/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. Extract: role, level, type, techstack, amount, userid
  // 2. Call Gemini API to generate questions
  //    (or use mock questions if quota exceeded)
  // 3. Save to Firebase interviews collection
  // 4. Return { success: true, interviewId }
}
```

---

### 2. INTERVIEW EXECUTION

User Flow:

```
/ (home page)
→ Click "View Interview" card
→ Navigate to /interview/[id]
→ Agent component loads
→ Click "Call" button
→ Vapi connects with custom config
→ AI starts asking questions
→ User answers (voice captured)
→ All messages recorded in transcript
→ Click "End"
→ Transcript sent to feedback API
```

Data loaded: `interview/[id]/page.tsx`

```typescript
const interview = await getInterviewById(id);
// interview.questions = ["Q1", "Q2", "Q3", ...]
```

Passed to Agent: `interview/[id]/page.tsx`

```tsx
<Agent
  userName={user.name}
  userId={user.id}
  interviewId={id}
  type="interview"
  questions={interview.questions} // ← Questions from Firebase!
  feedbackId={feedback?.id}
/>
```

Custom config created: `components/Agent.tsx`

```typescript
const startCall = async () => {
  if (questions && questions.length > 0 && type === 'interview') {
    // Create custom config with questions embedded
    const customConfig = createVapiAssistantConfig({
      questions: questions as string[],
      userName,
    });
    // Start Vapi with custom config
    await vapiRef.current.start(customConfig);
  }
};
```

Config generation: `lib/vapi.ts`

```typescript
export function createVapiAssistantConfig(params) {
  return {
    name: 'MockMate Interview Assistant',
    model: {
      provider: 'openai',
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `
          Ask these questions in order:
          1. ${questions[0]}
          2. ${questions[1]}
          3. ${questions[2]}
          ...
          
          Guidelines:
          - Ask one question at a time
          - Listen to full answer
          - Ask brief follow-ups if vague
          - Move to next question when done
          - Be professional and conversational
          - Thank candidate and conclude
        `,
        },
      ],
    },
    // ... transcriber, voice configs ...
  };
}
```

Message capture: `components/Agent.tsx`

```typescript
vapi.on('message', (message) => {
  // Type 1: Live transcripts
  if (message.type === 'transcript') {
    setMessages((prev) => [...prev, message.transcript]);
  }

  // Type 2: Full conversation
  if (message.type === 'add-message') {
    setTranscript((prev) => [
      ...prev,
      {
        role: message.role,
        content: message.content,
      },
    ]);
  }
});
```

---

### 3. FEEDBACK GENERATION

User Flow:

```
Click "End" button
→ Transcript sent to /api/feedback/create
→ Gemini AI analyzes conversation
→ Feedback generated with scores
→ Saved to Firebase feedback collection
→ User redirected to feedback page
```

Send transcript: `components/Agent.tsx`

```typescript
const endCall = async () => {
  await vapiRef.current?.stop();
  setCallStatus(CallStatus.FINISHED);

  if (transcript.length > 0 && interviewId && userId) {
    await fetch('/api/feedback/create', {
      method: 'POST',
      body: JSON.stringify({
        interviewId,
        userId,
        transcript, // Array of {role, content}
        feedbackId,
      }),
    });
  }
};
```

API endpoint: `app/api/feedback/create/route.ts`

```typescript
export async function POST(request: Request) {
  const { interviewId, userId, transcript, feedbackId } = await request.json();

  // Call createFeedback server action
  const result = await createFeedback({
    interviewId,
    userId,
    transcript,
    feedbackId,
  });

  return Response.json({
    success: result.success,
    feedbackId: result.feedbackId,
  });
}
```

Generate feedback: `lib/actions/general.action.ts`

```typescript
export async function createFeedback(params) {
  const { transcript } = params;

  const { object } = await generateObject({
    model: google('gemini-2.0-flash-001'),
    schema: feedbackSchema,
    prompt: `Analyze this interview transcript...
      
      Score on 0-100:
      - Communication Skills
      - Technical Knowledge
      - Problem-Solving
      - Cultural Fit
      - Confidence & Clarity
    `,
  });

  // Save to Firebase
  await db.collection('feedback').set({
    totalScore: object.totalScore,
    categoryScores: object.categoryScores,
    strengths: object.strengths,
    areasForImprovement: object.areasForImprovement,
    finalAssessment: object.finalAssessment,
    createdAt: new Date().toISOString(),
  });

  return { success: true, feedbackId };
}
```

---

### 4. FEEDBACK DISPLAY

User Flow:

```
/interview/[id]/feedback page
→ Load feedback from Firebase
→ Display scores and insights
→ Option to retake interview
```

Load feedback: `interview/[id]/feedback/page.tsx`

```typescript
const feedback = await getFeedbackByInterviewId({
  interviewId: id,
  userId: user.id,
});
```

---

## STATE FLOW DIAGRAM

```
Interview Form State
  ↓ (submit)
API generates questions
  ↓ (saves to Firebase)
Interview Document Created
  ↓ (user clicks interview card)
Agent Component Loads
  ↓ (user clicks Call)
createVapiAssistantConfig
  ↓ (embeds questions)
Vapi Initialized
  ↓ (AI asks questions)
Messages Captured
  ↓ (user clicks End)
Transcript Sent to API
  ↓ (Gemini analyzes)
Feedback Generated
  ↓ (saves to Firebase)
Feedback Page Displays
  ↓ (user can retake)
New Interview Created
```

---

## COMPONENT HIERARCHY

```
(root)/
  ├─ page.tsx (Home - shows interviews)
  ├─ interview/
  │  ├─ page.tsx (Form)
  │  │  └─ InterviewForm (component)
  │  └─ [id]/
  │     ├─ page.tsx (Interview details)
  │     │  └─ Agent (component)
  │     └─ feedback/
  │        └─ page.tsx (Feedback display)
```

---

## KEY INTEGRATION POINTS

**1. Questions pass from Firebase → Agent**

```typescript
const interview = getInterviewById(interviewId);
<Agent questions={interview.questions} />
```

**2. Questions pass from Agent → Vapi**

```typescript
const config = createVapiAssistantConfig({ questions });
vapi.start(config);
```

**3. Transcript capture from Vapi → State**

```typescript
vapi.on('message', (msg) => setTranscript([...transcript, msg]));
```

**4. Transcript send to API → Feedback**

```typescript
fetch('/api/feedback/create', {
  body: JSON.stringify({ transcript }),
});
```

**5. Feedback display from Firebase → Page**

```typescript
const feedback = getFeedbackByInterviewId(...);
<div>{feedback.totalScore}</div>
```

---

## ERROR HANDLING

**API quota exceeded?**

```typescript
try {
  const questions = await generateText(...);
} catch (error) {
  // Use mock questions
  const questions = generateMockQuestions(...);
}
```

**Vapi connection failed?**

```typescript
try {
  await vapiRef.current.start(config);
} catch (error) {
  setCallStatus(CallStatus.INACTIVE);
  console.error('Vapi failed:', error);
}
```

**Feedback generation failed?**

```typescript
try {
  await fetch('/api/feedback/create', ...);
} catch (error) {
  console.error('Feedback failed:', error);
  // Show error toast
}
```
