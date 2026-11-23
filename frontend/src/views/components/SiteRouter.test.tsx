import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { SiteRouter } from './SiteRouter';
import { officialSpacePhoto } from '../../services/spaces.service';

function Location() {
  const { pathname, search, hash } = useLocation();
  return <output>{pathname}{search}{hash}</output>;
}

function ExampleSite() {
  return (
    <SiteRouter>
      <Link to="/parceiros">Parceiros</Link>
      <Link to="/#parceiros">Seção de parceiros</Link>
      <Location />
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/parceiros" element={<h1>Nossos parceiros</h1>} />
        <Route path="/estrutura/reserva" element={<h1>Reservar</h1>} />
      </Routes>
    </SiteRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

it('mantém o prefixo do Pages ao navegar e ao abrir novamente uma página interna', () => {
  vi.stubEnv('BASE_URL', '/Squad-SEMISPE/');
  window.history.replaceState(null, '', '/Squad-SEMISPE/');
  render(<ExampleSite />);
  expect(screen.getByRole('heading', { name: 'Home' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Parceiros' }).getAttribute('href')).toBe('#/parceiros');
  fireEvent.click(screen.getByRole('link', { name: 'Parceiros' }));
  expect(window.location.pathname).toBe('/Squad-SEMISPE/');
  expect(window.location.hash).toBe('#/parceiros');
  expect(screen.getByRole('heading', { name: 'Nossos parceiros' })).toBeTruthy();
  cleanup();
  render(<ExampleSite />);
  expect(screen.getByRole('heading', { name: 'Nossos parceiros' })).toBeTruthy();
});

it('preserva parâmetros da reserva e os fragmentos das seções dentro da rota do Pages', () => {
  vi.stubEnv('BASE_URL', '/Squad-SEMISPE/');
  window.history.replaceState(null, '', '/Squad-SEMISPE/#/estrutura/reserva?espaco=3');
  render(<ExampleSite />);
  expect(screen.getByRole('heading', { name: 'Reservar' })).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe('/estrutura/reserva?espaco=3');
  fireEvent.click(screen.getByRole('link', { name: 'Seção de parceiros' }));
  expect(window.location.hash).toBe('#/#parceiros');
  expect(screen.getByRole('status').textContent).toBe('/#parceiros');
});

it('mantém rotas locais sem hash e resolve as fotos com o prefixo do build', () => {
  vi.stubEnv('BASE_URL', '/');
  window.history.replaceState(null, '', '/parceiros');
  render(<ExampleSite />);
  expect(screen.getByRole('heading', { name: 'Nossos parceiros' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Parceiros' }).getAttribute('href')).toBe('/parceiros');
  expect(officialSpacePhoto('Sala de Reunião 1')).toBe('/images/spaces/sala-reuniao-1.jpg');
  vi.stubEnv('BASE_URL', '/Squad-SEMISPE/');
  expect(officialSpacePhoto('Sala de Reunião 1')).toBe('/Squad-SEMISPE/images/spaces/sala-reuniao-1.jpg');
});
