import { redirect } from 'next/navigation';

export default async function FileRedirectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/api/files/${id}`);
}
