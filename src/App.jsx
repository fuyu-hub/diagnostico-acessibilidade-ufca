import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { VistoriaProvider } from './contexto/VistoriaContext';
import Painel from './telas/Painel';
import NovaVistoria from './telas/NovaVistoria';
import ListaItens from './telas/ListaItens';
import ItemChecklist from './telas/ItemChecklist';
import Triagem from './telas/Triagem';
import ResumoBloco from './telas/ResumoBloco';
import Resultado from './telas/Resultado';
import Ajustes from './telas/Ajustes';
import DashboardVistoria from './telas/DashboardVistoria';

export default function App() {
  return (
    <VistoriaProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Painel />} />
          <Route path="/nova" element={<NovaVistoria />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/vistoria/:id" element={<DashboardVistoria />} />
          <Route path="/checklist/:id/itens" element={<ListaItens />} />
          <Route path="/checklist/:id/item/:n" element={<ItemChecklist />} />
          <Route path="/checklist/:id/triagem/:itemId" element={<Triagem />} />
          <Route path="/checklist/:id/resumo-bloco" element={<Resultado />} />
          <Route path="/checklist/:id/resultado" element={<Resultado />} />
        </Routes>
      </BrowserRouter>
    </VistoriaProvider>
  );
}
