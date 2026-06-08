import LeadDetailClient from './LeadDetailClient';

export const metadata = {
  title: 'Lead Details | NEXORA CRM',
};

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadDetailClient leadId={id} />;
}
