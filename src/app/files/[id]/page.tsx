import { redirect } from 'next/navigation';

export default async function FileRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/api/files/${id}`);
}
