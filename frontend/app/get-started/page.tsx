import type { Metadata } from 'next';
import Onboarding from '../../components/Onboarding';

export const metadata: Metadata = {
  title: 'Get started | ResearchFlow',
};

export default function GetStartedPage() {
  return <Onboarding />;
}
