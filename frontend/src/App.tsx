import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './views/pages/HomePage';
import { EstruturaPage } from './views/pages/EstruturaPage';
import { SpacesOverview } from './views/components/SpacesOverview';
import { ComingSoonPanel } from './views/components/ComingSoonPanel';
import { AgendaPanel } from './views/components/AgendaPanel';
import { ReservaChat } from './views/components/ReservaChat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/estrutura" element={<EstruturaPage />}>
          <Route index element={<SpacesOverview />} />
          <Route path="agenda" element={<AgendaPanel />} />
          <Route path="reserva" element={<ReservaChat />} />
          <Route path="como-funciona" element={<ComingSoonPanel itemId="como-funciona" />} />
          <Route path="duvidas" element={<ComingSoonPanel itemId="duvidas" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
