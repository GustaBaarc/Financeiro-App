import { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Trash2, Edit2, Plus, CreditCard, Shield } from 'lucide-react';
import AdminPanel from './AdminPanel';

export default function SettingsModal({ onClose }) {
  const { banks, addBank, updateBank, deleteBank, transactions, userProfile } = useExpense();
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' ou 'admin'
  const [editingBank, setEditingBank] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [last4, setLast4] = useState('');

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setIsAdding(false);
    setName(bank.name);
    setColor(bank.color);
    setLast4(bank.last4);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingBank(null);
    setName('');
    setColor('#6366f1');
    setLast4('');
  };

  const handleDelete = (id) => {
    const hasTransactions = transactions.some(t => t.bankId === id);
    if (hasTransactions) {
      if (!window.confirm("Aviso: Existem transações associadas a este cartão. Tem certeza que deseja excluí-lo?")) {
        return;
      }
    }
    deleteBank(id);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isAdding) {
      addBank({ name, color, last4 });
    } else if (editingBank) {
      updateBank(editingBank.id, { name, color, last4 });
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingBank(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {(userProfile?.role === 'admin' || userProfile?.role === 'master') && (
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setActiveTab('cards')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'cards' ? 'bold' : 'normal', color: activeTab === 'cards' ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              Meus Cartões
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'admin' ? 'bold' : 'normal', color: activeTab === 'admin' ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              Administração
            </button>
          </div>
        )}

        {activeTab === 'admin' ? (
          <AdminPanel />
        ) : (
          <>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard /> Meus Cartões / Contas
            </h2>
            
            {isAdding || editingBank ? (
          <form onSubmit={handleSave} style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{isAdding ? 'Novo Cartão' : 'Editar Cartão'}</h3>
            <div className="form-group">
              <label>Nome do Cartão/Banco</label>
              <input 
                type="text" 
                className="form-control" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cor</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    title="Hexadecimal da cor. Ex: #FF0000"
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Últimos 4 Dígitos</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={last4}
                  onChange={e => setLast4(e.target.value)}
                  maxLength="4"
                  placeholder="Ex: 1234"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn" onClick={cancelEdit} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        ) : (
          <>
            <div className="history-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {banks.map(bank => (
                <div key={bank.id} className="history-item" style={{ borderLeft: `4px solid ${bank.color}` }}>
                  <div className="history-details">
                    <div style={{ fontWeight: '600' }}>{bank.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Final: {bank.last4 || 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEdit(bank)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(bank.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {banks.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Nenhum cartão cadastrado.</p>
              )}
            </div>
            
            <button className="btn btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Adicionar Cartão
            </button>
          </>
        )}
        </>
        )}

        {!isAdding && !editingBank && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
             <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>Fechar Configurações</button>
          </div>
        )}
      </div>
    </div>
  );
}
