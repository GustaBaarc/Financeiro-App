import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  LogOut,
  Plus,
  Settings,
  Upload,
  WalletCards,
  X,
} from 'lucide-react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import CardVisualizer from './components/CardVisualizer';
import Dashboard from './components/Dashboard';
import TransactionModal from './components/TransactionModal';
import CsvImportModal from './components/CsvImportModal';
import SettingsModal from './components/SettingsModal';
import Login from './components/Login';
import AIAssistant from './components/AIAssistant';
import PasswordRecovery from './components/PasswordRecovery';
import { exportToCSV } from './utils/export';
import { supabase } from './supabaseClient';

function AppContent() {
  const [transactionModal, setTransactionModal] = useState({ open: false, transaction: null });
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const { transactions, banks, addBank, userProfile, dataError, dismissDataError } = useExpense();

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const showMessage = (message, type = 'success') => {
    clearTimeout(noticeTimer.current);
    setNotice({ message, type });
    noticeTimer.current = setTimeout(() => setNotice(null), 4200);
  };

  const openTransaction = (transaction = null) => setTransactionModal({ open: true, transaction });
  const closeTransaction = () => setTransactionModal({ open: false, transaction: null });

  const handleAIResult = async (result) => {
    if (result.intent === 'bank') {
      try {
        await addBank(result.data);
        showMessage(`Conta ${result.data.name} adicionada pela assistente.`);
      } catch (error) {
        showMessage(error.message || 'Não foi possível adicionar a conta.', 'error');
      }
      return;
    }
    openTransaction(result.data);
  };

  const handleExport = () => {
    try {
      exportToCSV(transactions, banks);
      showMessage('Arquivo CSV gerado com sucesso.');
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const displayName = userProfile?.full_name || userProfile?.name;

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="app-container">
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark"><WalletCards size={24} /></div>
            <div>
              <span className="brand-name">Minhas Finanças</span>
              <p>{displayName ? `Olá, ${displayName.split(' ')[0]}.` : 'Seu dinheiro, com mais clareza.'}</p>
            </div>
          </div>

          <nav className="header-actions" aria-label="Ações principais">
            <button type="button" className="header-button" onClick={handleExport} title="Exportar CSV">
              <Download size={18} /><span>Exportar</span>
            </button>
            <button type="button" className="header-button" onClick={() => setIsCsvModalOpen(true)} title="Importar CSV">
              <Upload size={18} /><span>Importar</span>
            </button>
            <button type="button" className="header-button icon-only-mobile" onClick={() => setIsSettingsOpen(true)} title="Configurações">
              <Settings size={18} /><span>Contas</span>
            </button>
            <button type="button" className="btn btn-primary new-transaction-button" onClick={() => openTransaction()}>
              <Plus size={18} /> Nova transação
            </button>
            <button
              type="button"
              className="icon-button logout-button"
              onClick={async () => {
                if (window.confirm('Deseja sair da sua conta?')) await supabase.auth.signOut();
              }}
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </nav>
        </header>

        {(dataError || notice) && (
          <div className={`global-notice ${(notice?.type || 'error')}`} role="status">
            {notice?.type === 'success' && <CheckCircle2 size={18} />}
            <span>{notice?.message || dataError}</span>
            <button type="button" onClick={() => { setNotice(null); dismissDataError(); }} aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        )}

        <div className="layout-grid">
          <aside className="sidebar">
            <div className="sidebar-heading">
              <div><span className="eyebrow">Carteira</span><h2>Suas contas</h2></div>
              <button type="button" className="text-button" onClick={() => setIsSettingsOpen(true)}>Gerenciar</button>
            </div>
            <CardVisualizer onManage={() => setIsSettingsOpen(true)} />
            <div className="sidebar-tip">
              <span>MF</span>
              <p><strong>Dica do mês</strong>Revise os gastos pendentes antes de fechar a fatura.</p>
            </div>
          </aside>

          <main className="main-content">
            <AIAssistant onResult={handleAIResult} />
            <Dashboard onEdit={openTransaction} onMessage={showMessage} />
          </main>
        </div>
      </div>

      <button type="button" className="fab" onClick={() => openTransaction()} aria-label="Nova transação">
        <Plus size={25} />
      </button>

      {transactionModal.open && (
        <TransactionModal
          initialData={transactionModal.transaction}
          onClose={closeTransaction}
          onSaved={showMessage}
        />
      )}
      {isCsvModalOpen && (
        <CsvImportModal
          onClose={() => setIsCsvModalOpen(false)}
          onImported={(count) => showMessage(`${count} transações importadas com sucesso.`)}
        />
      )}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onMessage={showMessage} />}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryStatus, setRecoveryStatus] = useState('idle');
  const [recoveryError, setRecoveryError] = useState('');

  useEffect(() => {
    let active = true;
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const recoveryRequested = queryParams.get('recovery') === '1'
      || queryParams.get('type') === 'recovery'
      || hashParams.get('type') === 'recovery';
    const callbackError = queryParams.get('error_description') || hashParams.get('error_description');
    const tokenHash = queryParams.get('token_hash');

    const initializeAuth = async () => {
      if (recoveryRequested) setRecoveryStatus('loading');

      if (callbackError) {
        if (!active) return;
        setRecoveryError('Este link expirou, já foi utilizado ou foi alterado pelo provedor de e-mail. Solicite um novo link.');
        setRecoveryStatus('error');
        setLoading(false);
        return;
      }

      if (tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (!active) return;
        if (error || !data.session) {
          setRecoveryError('Não foi possível validar este link. Ele pode ter expirado ou já ter sido usado.');
          setRecoveryStatus('error');
        } else {
          setSession(data.session);
          setRecoveryStatus('ready');
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (recoveryRequested) {
        if (error || !data.session) {
          setRecoveryError('O Supabase não forneceu uma sessão válida para este link. Solicite uma nova recuperação.');
          setRecoveryStatus('error');
        } else {
          setRecoveryStatus('ready');
        }
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryStatus('ready');
        setRecoveryError('');
      }
      setLoading(false);
    });

    initializeAuth();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="app-loading" role="status">
        <div className="loading-mark">MF</div>
        <div className="loading-bar"><span /></div>
        <p>Preparando seu espaço...</p>
      </div>
    );
  }

  const finishRecovery = async (invalid = false) => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setRecoveryStatus('idle');
    setRecoveryError('');
    if (invalid) {
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  if (recoveryStatus === 'error') {
    return <PasswordRecovery invalidReason={recoveryError} onComplete={() => finishRecovery(true)} />;
  }

  if (recoveryStatus === 'ready' && session) {
    return <PasswordRecovery onComplete={() => finishRecovery(false)} />;
  }

  if (!session) return <Login />;

  return <ExpenseProvider><AppContent /></ExpenseProvider>;
}
