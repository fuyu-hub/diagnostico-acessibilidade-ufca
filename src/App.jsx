import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LimiteErro from './componentes/LimiteErro';
import { NotificacaoProvider } from './contexto/NotificacaoContext';
import { VistoriaProvider } from './contexto/VistoriaContext';
import Painel from './telas/Painel';
import NovaVistoria from './telas/NovaVistoria';
import ListaItens from './telas/ListaItens';
import ItemChecklist from './telas/ItemChecklist';
import Resultado from './telas/Resultado';
import Ajustes from './telas/Ajustes';
import DashboardVistoria from './telas/DashboardVistoria';
import Sobre from './telas/Sobre';
import NaoEncontrada from './telas/NaoEncontrada';
import ModalBoasVindas from './componentes/ModalBoasVindas';
import AtualizacaoApp from './componentes/AtualizacaoApp';

// Cada tela abre do topo, em vez de herdar a rolagem da tela anterior
function RolarAoTopo() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <LimiteErro>
      <NotificacaoProvider>
        <VistoriaProvider>
          <ModalBoasVindas />
          <BrowserRouter>
            <RolarAoTopo />
            <AtualizacaoApp />
            <Routes>
              <Route path="/" element={<Painel />} />
              <Route path="/nova" element={<NovaVistoria />} />
              <Route path="/ajustes" element={<Ajustes />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/vistoria/:id" element={<DashboardVistoria />} />
              <Route path="/checklist/:id/itens" element={<ListaItens />} />
              <Route path="/checklist/:id/item/:n" element={<ItemChecklist />} />
              <Route path="/checklist/:id/resumo-bloco" element={<Resultado />} />
              <Route path="/checklist/:id/resultado" element={<Resultado />} />
              <Route path="*" element={<NaoEncontrada />} />
            </Routes>
          </BrowserRouter>
        </VistoriaProvider>
      </NotificacaoProvider>
    </LimiteErro>
  );
}
