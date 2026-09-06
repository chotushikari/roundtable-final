import { CompanyAnalysisPage } from '@/components/CompanyAnalysisPage';

export default async function AnalysisPage({ params }: PageProps<'/company/analysis/[sessionId]'>) {
  const { sessionId } = await params;
  return <CompanyAnalysisPage sessionId={sessionId}/>;
}
