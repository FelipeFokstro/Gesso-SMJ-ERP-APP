import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import Clientes from '../pages/Clientes';
import Orcamentos from '../pages/Orcamentos';
import Estoque from '../pages/Estoque';
import Financeiro from '../pages/Financeiro';
import Catalogo from '../pages/Catalogo';
import Configuracoes from '../pages/Configuracoes';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/orcamentos" element={<Orcamentos />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  );
}