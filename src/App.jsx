import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
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
import EntrarGrupo from './telas/EntrarGrupo';
import ModalBoasVindas from './componentes/ModalBoasVindas';
import AtualizacaoApp from './componentes/AtualizacaoApp';

// Ao trocar de tela: abre do topo (ao voltar, o navegador restaura a rolagem), atualiza o título
// da aba e leva o foco ao título da tela, para o leitor de tela anunciar onde a pessoa está.
function AoTrocarDeTela() {
  const { pathname, search } = useLocation();
  const tipo = useNavigationType();
  const primeira = useRef(true);
  const secao = new URLSearchParams(search).get('secao');

  useEffect(() => {
    if (tipo !== 'POP') window.scrollTo(0, 0);

    const titulo = document.querySelector('h1');
    document.title = titulo?.textContent ? `${titulo.textContent} · Rota Acessível` : 'Rota Acessível';

    if (primeira.current) {
      primeira.current = false;
      return;
    }
    // O item cuida do próprio foco, na pergunta
    if (titulo && !pathname.includes('/item/')) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, secao]);

  return null;
}

export default function App() {
  return (
    <LimiteErro>
      <NotificacaoProvider>
        <VistoriaProvider>
          <ModalBoasVindas />
          <BrowserRouter>
            <AoTrocarDeTela />
            <AtualizacaoApp />
            <Routes>
              <Route path="/" element={<Painel />} />
              <Route path="/nova" element={<NovaVistoria />} />
              <Route path="/ajustes" element={<Ajustes />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/vistoria/:id" element={<DashboardVistoria />} />
              <Route path="/checklist/:id/itens" element={<ListaItens />} />
              <Route path="/checklist/:id/item/:n" element={<ItemChecklist />} />
              <Route path="/checklist/:id/resultado" element={<Resultado />} />
              <Route path="/grupo/:codigo" element={<EntrarGrupo />} />
              <Route path="*" element={<NaoEncontrada />} />
            </Routes>
          </BrowserRouter>
        </VistoriaProvider>
      </NotificacaoProvider>
    </LimiteErro>
  );
}
