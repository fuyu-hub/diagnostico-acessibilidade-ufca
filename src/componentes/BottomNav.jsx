import { useNavigate, useLocation } from 'react-router-dom';
import { IconBuildingCommunity, IconPlus, IconSettings } from '@tabler/icons-react';
import styles from './BottomNav.module.css';

const ABAS = [
  { label: 'Vistorias', icone: IconBuildingCommunity, rota: '/' },
  { label: 'Nova', icone: IconPlus, rota: '/nova' },
  { label: 'Ajustes', icone: IconSettings, rota: '/ajustes' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className={styles.nav}>
      {ABAS.map(({ label, icone: Icone, rota }) => {
        const ativo = pathname === rota;
        return (
          <button
            key={rota}
            className={`${styles.aba} ${ativo ? styles.ativo : ''}`}
            onClick={() => navigate(rota)}
          >
            <Icone size={26} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
