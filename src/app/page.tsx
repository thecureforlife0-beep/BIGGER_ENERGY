
import { UnpurchasedHomepage } from '@/components/UnpurchasedHomepage';
import { PurchasedExperience } from '@/components/PurchasedExperience';
import { AccessDenied } from '@/components/AccessDenied';
import { verifyTokenOnServer } from '@/lib/server-auth';
import { storefrontContent } from '@/lib/course-content';
import { cookies } from 'next/headers';

const COURSE_ID = storefrontContent.course.id;

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const accessState = resolvedSearchParams?.access;
  if (accessState === 'invalid') {
    return <AccessDenied reason="This access link is invalid or has expired." />;
  }
  if (accessState === 'unavailable') {
    return <AccessDenied reason="Access verification is temporarily unavailable. Please try again shortly." />;
  }

  const tokenValue = resolvedSearchParams?.token;
  const token = typeof tokenValue === 'string' ? tokenValue : undefined;

  if (token) {
    const verification = await verifyTokenOnServer(token, COURSE_ID);
    if (verification.isValid) return <PurchasedExperience courseId={COURSE_ID} />;
    return <AccessDenied reason={verification.error} />;
  }

  const accessCookie = (await cookies()).get('eggplant_access')?.value;
  if (accessCookie) {
    const verification = await verifyTokenOnServer(accessCookie, COURSE_ID);
    if (verification.isValid) return <PurchasedExperience courseId={COURSE_ID} />;
    return <AccessDenied reason={verification.error} />;
  }

  return <UnpurchasedHomepage />;
}
