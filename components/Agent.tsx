'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import { cn } from '@/lib/utils';
import { createVapiAssistantConfig } from '@/lib/vapi';

enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const vapiRef = useRef<Vapi | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ role: string; content: string }>
  >([]);

  useEffect(() => {
    const publicKey =
      process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ??
      process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

    if (!publicKey) {
      console.error(
        'Vapi public key/web token is missing. Set NEXT_PUBLIC_VAPI_PUBLIC_KEY or NEXT_PUBLIC_VAPI_WEB_TOKEN in .env.local',
      );
      return;
    }

    const vapi = new Vapi(publicKey);
    console.log('Vapi initialized:', vapi);
    vapiRef.current = vapi;

    // When call starts
    vapi.on('call-start', () => {
      setCallStatus(CallStatus.ACTIVE);
    });

    // When call ends
    vapi.on('call-end', () => {
      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
    });

    // Assistant speaking
    vapi.on('speech-start', () => {
      setIsSpeaking(true);
    });

    vapi.on('speech-end', () => {
      setIsSpeaking(false);
    });

    // Live transcript & full message capture
    vapi.on(
      'message',
      (message: {
        type: string;
        transcript?: string;
        role?: string;
        content?: string;
      }) => {
        console.log('Vapi message:', message);

        if (message.type === 'transcript' && message.transcript !== undefined) {
          setMessages((prev) => [...prev, message.transcript as string]);
        }

        // Capture user and assistant messages for feedback
        if (message.type === 'add-message' && message.role && message.content) {
          setTranscript((prev) => [
            ...prev,
            {
              role: message.role as string,
              content: message.content as string,
            },
          ]);
        }
      },
    );

    return () => {
      vapiRef.current?.stop?.();
    };
  }, []);

  // Start Call
  const startCall = async () => {
    try {
      if (!vapiRef.current) {
        console.error('Vapi is not initialized');
        return;
      }

      setCallStatus(CallStatus.CONNECTING);
      setMessages([]);
      setTranscript([]);

      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        console.error(
          'VAPI assistant id missing. Set NEXT_PUBLIC_VAPI_ASSISTANT_ID in .env.local',
        );
        setCallStatus(CallStatus.INACTIVE);
        return;
      }

      // If we have interview questions, create a custom assistant config
      if (questions && questions.length > 0 && type === 'interview') {
        const customConfig = createVapiAssistantConfig({
          questions: questions as string[],
          userName,
        });
        await vapiRef.current.start(customConfig);
      } else {
        await vapiRef.current.start(assistantId);
      }
    } catch (err) {
      console.error('Error starting call:', err);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  // End Call
  const endCall = async () => {
    await vapiRef.current?.stop();
    setCallStatus(CallStatus.FINISHED);

    // Save transcript if we have an interview
    if (transcript.length > 0 && interviewId && userId) {
      try {
        await fetch('/api/feedback/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId,
            userId,
            transcript,
            feedbackId,
          }),
        });
      } catch (error) {
        console.error('Error saving transcript:', error);
      }
    }
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/mock-mate-ai-bot.png"
              alt="vapi"
              fill
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>

          <p className=" text-2xl font-semibold">AI Interviewer</p>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user_avatar2.png"
              alt="user avatar"
              width={540}
              height={540}
              className="rounded-full size-37.5"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                'transition-opacity duration-500',
                'animate-fadeIn',
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== CallStatus.ACTIVE ? (
          <button onClick={startCall} className="relative btn-call">
            <span
              className={cn(
                'absolute animate-ping rounded-full opacity-75',
                callStatus !== CallStatus.CONNECTING && 'hidden',
              )}
            />

            <span>
              {callStatus === CallStatus.INACTIVE ||
              callStatus === CallStatus.FINISHED
                ? 'Call'
                : '. . .'}
            </span>
          </button>
        ) : (
          <button onClick={endCall} className="btn-disconnect">
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
