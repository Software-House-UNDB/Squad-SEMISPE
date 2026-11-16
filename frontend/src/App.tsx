import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './views/pages/HomePage';
import { EstruturaPage } from './views/pages/EstruturaPage';
import { QuemSomosPage } from './views/pages/QuemSomosPage';
import { SpacesOverview } from './views/components/SpacesOverview';
import { ComingSoonPanel } from './views/components/ComingSoonPanel';
import { AgendaPanel } from './views/components/AgendaPanel';
import { ReservaPanel } from './views/components/ReservaPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quem-somos" element={<QuemSomosPage />} />
        <Route path="/estrutura" element={<EstruturaPage />}>
          <Route index element={<SpacesOverview />} />
          <Route path="agenda" element={<AgendaPanel />} />
          <Route path="reserva" element={<ReservaPanel />} />
          <Route path="como-funciona" element={<ComingSoonPanel itemId="como-funciona" />} />
          <Route path="duvidas" element={<ComingSoonPanel itemId="duvidas" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
