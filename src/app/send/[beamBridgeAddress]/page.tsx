import { SendPage } from '@/features/bridge/pages/SendPage';

export default function Page({ params }: { params: { beamBridgeAddress: string } }) {
  return <SendPage beamBridgeAddress={params.beamBridgeAddress} />;
}

