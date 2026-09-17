import { redirect } from 'next/navigation';

export default function SafeguardingPage() {
  redirect('/admin/governance?tab=safeguarding');
}
