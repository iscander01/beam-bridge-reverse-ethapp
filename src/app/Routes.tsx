import { Navigate, Route, Routes as RRDRoutes } from 'react-router-dom';
import { Shell } from '../shared/ui/Shell';
import { HomePage } from '../features/bridge/pages/HomePage';
import { SendPage } from '../features/bridge/pages/SendPage';
import { ReceivePage } from '../features/bridge/pages/ReceivePage';

export function Routes() {
  return (
    <RRDRoutes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="send" element={<SendPage />} />
        <Route path="send/:beamBridgeAddress" element={<SendPage />} />
        <Route path="receive" element={<ReceivePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </RRDRoutes>
  );
}
