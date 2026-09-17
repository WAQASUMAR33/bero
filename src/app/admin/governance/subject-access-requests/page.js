import { redirect } from 'next/navigation';

export default function SubjectAccessRequestsPage() {
  redirect('/admin/governance?tab=sar');
}
