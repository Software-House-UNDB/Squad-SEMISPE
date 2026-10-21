import { Route, Routes } from 'react-router-dom'
import StationsPage from './views/pages/StationsPage'

function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Squad SEMISPE - Parque Tecnológico</h1>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/estacoes" element={<StationsPage />} />
    </Routes>
  );
}
