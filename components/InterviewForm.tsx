'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import FormField from '@/components/FormField';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

const interviewFormSchema = z.object({
  role: z.string().min(2, 'Role is required'),
  level: z.string().min(2, 'Level is required'),
  type: z.string().min(2, 'Type is required'),
  techstack: z.string().min(2, 'Tech stack is required'),
  amount: z.number().min(1, 'At least 1 question required'),
});

type InterviewFormData = z.infer<typeof interviewFormSchema>;

interface InterviewFormProps {
  userId: string;
}

const InterviewForm = ({ userId }: InterviewFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      role: '',
      level: 'Junior',
      type: 'Technical',
      techstack: '',
      amount: 5,
    },
  });

  async function onSubmit(values: InterviewFormData) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vapi/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          userid: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error('Failed to create interview');
        setIsLoading(false);
        return;
      }

      toast.success('Interview created successfully!');
      router.push('/');
    } catch (error) {
      console.error('Error creating interview:', error);
      toast.error('Failed to create interview');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card-border max-w-2xl w-full">
      <div className="card py-10 px-10">
        <h2 className="mb-6">Setup Your Interview</h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="form space-y-6"
          >
            <FormField
              control={form.control}
              name="role"
              label="Job Role"
              placeholder="e.g., Frontend Developer, Full Stack Engineer"
            />

            <FormItem>
              <FormLabel className="label">Experience Level</FormLabel>
              <FormControl>
                <select
                  {...form.register('level')}
                  className="input bg-dark-200! rounded-full! min-h-12! px-5! cursor-pointer"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel className="label">Interview Type</FormLabel>
              <FormControl>
                <select
                  {...form.register('type')}
                  className="input bg-dark-200! rounded-full! min-h-12! px-5! cursor-pointer"
                >
                  <option value="Technical">Technical</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Behavioral">Cultural</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormField
              control={form.control}
              name="techstack"
              label="Tech Stack"
              placeholder="e.g., React, Node.js, TypeScript (comma separated)"
            />

            <FormItem>
              <FormLabel className="label">Number of Questions</FormLabel>
              <FormControl>
                <input
                  type="number"
                  {...form.register('amount', { valueAsNumber: true })}
                  min="1"
                  max="20"
                  className="input bg-dark-200! rounded-full! min-h-12! px-5!"
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <Button className="btn w-full!" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating Interview...' : 'Create Interview'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default InterviewForm;
