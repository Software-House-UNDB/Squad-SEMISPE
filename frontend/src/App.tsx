import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './views/pages/HomePage';
import { EstruturaPage } from './views/pages/EstruturaPage';
import { QuemSomosPage } from './views/pages/QuemSomosPage';
import { SpacesOverview } from './views/components/SpacesOverview';
import { ComingSoonPanel } from './views/components/ComingSoonPanel';
import { AgendaPanel } from './views/components/AgendaPanel';
import { ReservaPanel } from './views/components/ReservaPanel';
import { AdminPage } from './views/pages/AdminPage';
import { AdminReservationsPage } from './views/pages/AdminReservationsPage';
import { AdminOverview } from './views/components/admin/AdminOverview';
import { AdminPlannedModule } from './views/components/admin/AdminPlannedModule';
import { ProfilePage } from './views/pages/ProfilePage';
import { ParceirosPage } from './views/pages/ParceirosPage';
import { BancoIdeiasPage } from './views/pages/BancoIdeiasPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quem-somos" element={<QuemSomosPage />} />
        <Route path="/parceiros" element={<ParceirosPage />} />
        <Route path="/banco-de-ideias" element={<BancoIdeiasPage />} />
        <Route path="/meus-dados" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminOverview />} />
          <Route path="reservas" element={<AdminReservationsPage />} />
          <Route path=":moduleId" element={<AdminPlannedModule />} />
        </Route>
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
