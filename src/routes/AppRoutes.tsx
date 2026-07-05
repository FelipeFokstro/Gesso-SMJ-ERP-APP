import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import Orcamentos from '../pages/Orcamentos';
import Estoque from '../pages/Estoque';
import Financeiro from '../pages/Financeiro';
import Catalogo from '../pages/Catalogo';
import Configuracoes from '../pages/Configuracoes';
import Agenda from '../pages/Agenda/agenda';

// CLIENTES
import Clientes from '../pages/Clientes/Clientes';
import NovoCliente from '../pages/Clientes/NovoCliente';
import EditarCliente from '../pages/Clientes/EditarCliente';
import ClienteDetalhes from '../pages/Clientes/ClienteDetalhes';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/orcamentos" element={<Orcamentos />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/agenda" element={<Agenda />} />

        {/* CLIENTES */}
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/novo" element={<NovoCliente />} />
        <Route path="/clientes/:id" element={<ClienteDetalhes />} />
        <Route path="/clientes/:id/editar" element={<EditarCliente />} />
      </Routes>
    </BrowserRouter>
  );
}