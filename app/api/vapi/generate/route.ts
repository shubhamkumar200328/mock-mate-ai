import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

import { db } from '@/firebase/admin';
import { getRandomInterviewCover } from '@/lib/utils';

// Mock questions for development/testing when API quota is exceeded
const generateMockQuestions = (
  role: string,
  level: string,
  type: string,
  amount: number,
) => {
  const mockQuestions: Record<string, string[]> = {
    technical: [
      'What is the difference between let, const, and var in JavaScript?',
      'Explain the concept of closures in programming.',
      'What are the key differences between SQL and NoSQL databases?',
      'How does async/await work in JavaScript?',
      'What is the difference between synchronous and asynchronous code?',
      'Explain the concept of promises and how they work.',
      'What is REST API and how does it differ from GraphQL?',
      'How do you optimize the performance of a web application?',
      'What is the purpose of middleware in web development?',
      'Explain the MVC architecture pattern.',
    ],
    behavioral: [
      'Tell me about a challenging project you worked on and how you overcame the challenges.',
      'Describe a situation where you had to work with a difficult team member.',
      'How do you prioritize tasks when you have multiple deadlines?',
      'Give an example of when you had to learn something new quickly.',
      'Describe a time when you made a mistake and how you handled it.',
      'How do you handle feedback and criticism from your team?',
      'Tell me about a time you took initiative beyond your job responsibilities.',
      'Describe your approach to debugging and problem-solving.',
      'How do you stay updated with new technologies and trends?',
      'Tell me about a project you are most proud of.',
    ],
    mixed: [
      'What is the difference between let, const, and var in JavaScript?',
      'Tell me about a challenging project you worked on.',
      'How does async/await work in JavaScript?',
      'Describe a situation where you had to work with a difficult team member.',
      'What are the key differences between SQL and NoSQL databases?',
      'How do you prioritize tasks when you have multiple deadlines?',
      'Explain the concept of closures in programming.',
      'Give an example of when you had to learn something new quickly.',
      'What is REST API and how does it differ from GraphQL?',
      'How do you handle feedback and criticism from your team?',
    ],
  };

  const typeKey =
    type.toLowerCase() === 'behavioral'
      ? 'behavioral'
      : type.toLowerCase() === 'technical'
        ? 'technical'
        : 'mixed';
  const questionPool = mockQuestions[typeKey] || mockQuestions.mixed;

  return questionPool.slice(0, Math.min(amount, questionPool.length));
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('VAPI BODY:', body);

    const { type, role, level, techstack, amount, userid } = body;

    if (!role || !type || !level || !techstack || !amount) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    let parsedQuestions = [];

    try {
      const { text: questions } = await generateText({
        model: google('gemini-2.0-flash-001'),
        prompt: `Prepare interview questions for a ${role} position at ${level} level.
        Focus: ${type} questions
        Tech Stack: ${techstack}
        Number of questions: ${amount}
        
        Return ONLY as JSON array format with no additional text:
        ["Question 1","Question 2",...]`,
      });

      try {
        parsedQuestions = JSON.parse(questions);
      } catch {
        parsedQuestions = [questions];
      }
    } catch (apiError: unknown) {
      console.warn(
        'Gemini API failed, using mock questions for development:',
        apiError,
      );

      // Fallback to mock questions
      parsedQuestions = generateMockQuestions(role, level, type, amount);
      console.log(
        'Using mock questions:',
        parsedQuestions.length,
        'questions generated',
      );
    }

    const interview = {
      role,
      type,
      level,
      techstack: techstack
        ? techstack.split(',').map((t: string) => t.trim())
        : [],
      questions: parsedQuestions,
      userId: userid || 'anonymous',
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('interviews').add(interview);

    return Response.json({ success: true, interviewId: docRef.id });
  } catch (error) {
    console.error('Interview creation error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

// export async function POST(request: Request) {
//   const { type, role, level, techstack, amount, userid } = await request.json();

//   try {
//     const { text: questions } = await generateText({
//       model: google('gemini-2.0-flash-001'),
//       prompt: `Prepare questions for a job interview.
//         The job role is ${role}.
//         The job experience level is ${level}.
//         The tech stack used in the job is: ${techstack}.
//         The focus between behavioural and technical questions should lean towards: ${type}.
//         The amount of questions required is: ${amount}.
//         Please return only the questions, without any additional text.
//         The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
//         Return the questions formatted like this:
//         ["Question 1", "Question 2", "Question 3"]

//         Thank you! <3
//     `,
//     });

//     const interview = {
//       role: role,
//       type: type,
//       level: level,
//       techstack: techstack.split(','),
//       questions: JSON.parse(questions),
//       userId: userid,
//       finalized: true,
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//     };

//     await db.collection('interviews').add(interview);

//     return Response.json({ success: true }, { status: 200 });
//   } catch (error) {
//     console.error('Error:', error);
//     return Response.json({ success: false, error: error }, { status: 500 });
//   }
// }

export async function GET() {
  return Response.json({ success: true, data: 'Thank you!' }, { status: 200 });
}
