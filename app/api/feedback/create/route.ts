import { createFeedback } from '@/lib/actions/general.action';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { interviewId, userId, transcript, feedbackId } = body;

    if (!interviewId || !userId || !transcript) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Call the server action to generate feedback from transcript
    const result = await createFeedback({
      interviewId,
      userId,
      transcript,
      feedbackId,
    });

    if (result.success) {
      return Response.json({
        success: true,
        feedbackId: result.feedbackId,
      });
    } else {
      return Response.json(
        { success: false, error: 'Failed to create feedback' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Feedback creation error:', error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
