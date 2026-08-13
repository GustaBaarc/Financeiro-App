import { useState, useEffect } from 'react'
import { Plus, Upload, Download, Settings, LogOut } from 'lucide-react'
import { ExpenseProvider } from './context/ExpenseContext'
import CardVisualizer from './components/CardVisualizer'
import Dashboard from './components/Dashboard'
import TransactionModal from './components/TransactionModal'
import CsvImportModal from './components/CsvImportModal'
import SettingsModal from './components/SettingsModal'
import Login from './components/Login'
import AIAssistant from './components/AIAssistant'
import { exportToCSV } from './utils/export'
import { useExpense } from './context/ExpenseContext'
import { supabase } from './supabaseClient'

function AppContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { transactions, banks, addBank } = useExpense();

  const handleAIResult = async (result) => {
    if (result.intent === 'bank') {
      try {
        await addBank(result.data);
        alert(`Cartão ${result.data.name} adicionado com sucesso pela IA!`);
      } catch (err) {
        alert("Erro ao adicionar cartão");
      }
    } else {
      // É uma transação
      setEditingTx(result.data);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>Minhas Finanças 2.0</h1>
          <p style={{ color: 'var(--text-muted)' }}>Controle integrado de Contas e Cartões.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn-icon" 
            onClick={() => setIsSettingsOpen(true)}
            title="Configurações"
          >
            <Settings size={20} />
          </button>
          <button 
            className="btn-icon" 
            onClick={async () => {
              if(window.confirm('Tem certeza que deseja sair?')) {
                await supabase.auth.signOut();
              }
            }}
            title="Sair"
          >
            <LogOut size={20} color="var(--danger)" />
          </button>
          <button 
            className="btn" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            onClick={() => exportToCSV(transactions, banks)}
            title="Exportar Dados"
          >
            <Download size={18} />
            Exportar
          </button>
          <button 
            className="btn" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            onClick={() => setIsCsvModalOpen(true)}
            title="Importar CSV"
          >
            <Upload size={18} />
            Importar
          </button>
        </div>
      </header>

      <div className="layout-grid">
        <aside className="sidebar">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: '600' }}>Minhas Contas</h2>
          <CardVisualizer />
        </aside>

        <main className="main-content">
          <section>
            <AIAssistant onResult={handleAIResult} />
          </section>

          <section>
            <Dashboard onEdit={(tx) => { setEditingTx(tx); setIsModalOpen(true); }} />
          </section>
        </main>
      </div>

      <button className="fab" onClick={() => { setEditingTx(null); setIsModalOpen(true); }} title="Nova Transação">
        <Plus size={28} />
      </button>

      {isModalOpen && <TransactionModal initialData={editingTx} onClose={() => { setIsModalOpen(false); setEditingTx(null); }} />}
      {isCsvModalOpen && <CsvImportModal onClose={() => setIsCsvModalOpen(false)} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  )
}
