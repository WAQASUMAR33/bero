import { redirect } from 'next/navigation';

export default function RiddorPage() {
  redirect('/admin/governance?tab=riddor');
}
