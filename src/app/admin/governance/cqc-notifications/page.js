import { redirect } from 'next/navigation';

export default function CqcNotificationsPage() {
  redirect('/admin/governance?tab=cqc');
}
