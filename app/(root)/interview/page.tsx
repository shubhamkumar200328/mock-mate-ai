import InterviewForm from '@/components/InterviewForm';
import { getCurrentUser } from '@/lib/actions/auth.action';

const Page = async () => {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <>
      <h3>Create a New Interview</h3>

      <InterviewForm userId={user.id} />
    </>
  );
};

export default Page;
