import { useNavigate } from 'react-router-dom';
import { IconSettings, IconPlus } from '@tabler/icons-react';
import { useVistoria } from '../contexto/VistoriaContext';
import CartaoVistoria from '../componentes/CartaoVistoria';
import styles from './Painel.module.css';

export default function Painel() {
  const { vistorias } = useVistoria();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="tela-body" style={{ padding: '24px 20px' }}>
        {/* Cabecalho */}
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Diagnostico NBR 9050</span>
            <h1 className={styles.titulo}>Vistorias</h1>
          </div>
          <button className={styles.btnSettings} aria-label="Ajustes" onClick={() => navigate('/ajustes')}>
            <IconSettings size={22} />
          </button>
        </div>

        {/* Criar nova */}
        <button className={`cartao ${styles.btnNova}`} onClick={() => navigate('/nova')}>
          <div className={styles.iconePlus}>
            <IconPlus size={28} />
          </div>
          <div>
            <p className={styles.novaLabel}>Criar Nova Vistoria</p>
            <p className={styles.novaDesc}>Cadastrar instituicao e iniciar diagnostico</p>
          </div>
        </button>

        {/* Lista */}
        {vistorias.length > 0 && (
          <>
            <p className="label-secao" style={{ marginTop: 8 }}>
              Vistorias Registradas ({vistorias.length})
            </p>
            <div className={styles.gridVistorias}>
              {vistorias.map(v => (
                <CartaoVistoria key={v.id} vistoria={v} />
              ))}
            </div>
          </>
        )}

        {vistorias.length === 0 && (
          <div className={styles.vazio}>
            <p>Nenhuma vistoria registrada.</p>
            <p>Crie uma nova para comecar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
