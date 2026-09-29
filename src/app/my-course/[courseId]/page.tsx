'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { courses } from '@/lib/course-data';
import { PurchasedExperience } from '@/components/PurchasedExperience';
import { AccessDenied } from '@/components/AccessDenied';

type VerificationStatus = 'verifying' | 'success' | 'error';

const CourseAccessPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  const legacyToken = searchParams.get('token');
  const course = courses.find((item) => item.id === courseId);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!course) {
        setErrorMessage('The course you are trying to access does not exist.');
        setStatus('error');
        return;
      }

      try {
        // Support existing emailed ?token= links once, then remove the bearer from the URL.
        if (legacyToken) {
          const response = await fetch('/api/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: legacyToken, courseId }),
            cache: 'no-store',
          });
          if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.error ?? 'This access link is invalid or expired.');
          }
          if (!cancelled) {
            setStatus('success');
            router.replace(`/my-course/${encodeURIComponent(courseId)}`);
          }
          return;
        }

        // New /access links set an HttpOnly cookie before redirecting here.
        const response = await fetch(`/api/verify-code?courseId=${encodeURIComponent(courseId)}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? 'No valid access session was found. Re-open your access email.');
        }
        if (!cancelled) setStatus('success');
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'We could not verify your access.');
          setStatus('error');
        }
      }
    };

    void verify();
    return () => { cancelled = true; };
  }, [course, courseId, legacyToken, router]);

  if (status === 'error') return <AccessDenied reason={errorMessage} />;

  return (
    <main className="mx-auto w-full max-w-[1180px] px-5 pb-20 pt-8 sm:px-8">
      {status === 'verifying' && (
        <div className="flex min-h-[40dvh] items-center justify-center" role="status" aria-live="polite">
          <p className="text-sm text-[var(--muted)]">Checking your private access…</p>
        </div>
      )}
      {status === 'success' && course && <PurchasedExperience courseId={courseId} />}
    </main>
  );
};

export default CourseAccessPage;
