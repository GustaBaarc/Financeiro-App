import { useState } from 'react';
import { AlertCircle, CreditCard, Edit3, Loader2, Plus, Shield, Trash2 } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import AdminPanel from './AdminPanel';
import Modal from './Modal';

const COLORS = ['#3267e3', '#7c3aed', '#db2777', '#e34b32', '#f97316', '#0f9f7a', '#0f766e', '#334155'];

export default function SettingsModal({ onClose, onMessage }) {
  const { banks, addBank, updateBank, deleteBank, transactions, userProfile } = useExpense();
  const canManageUsers = userProfile?.role === 'admin' || userProfile?.role === 'master';
  const [activeTab, setActiveTab] = useState('cards');
  const [editingBank, setEditingBank] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3267e3');
  const [last4, setLast4] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setIsAdding(false);
    setName(bank.name || '');
    setColor(bank.color || '#3267e3');
    setLast4(bank.last4 || '');
    setError('');
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingBank(null);
    setName('');
    setColor('#3267e3');
    setLast4('');
    setError('');
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingBank(null);
    setError('');
  };

  const handleDelete = async (bank) => {
    const linkedCount = transactions.filter(transaction => String(transaction.bankId) === String(bank.id)).length;
    const message = linkedCount
      ? `${bank.name} possui ${linkedCount} transações vinculadas. Excluir mesmo assim?`
      : `Excluir a conta ${bank.name}?`;
    if (!window.confirm(message)) return;

    try {
      await deleteBank(bank.id);
      onMessage?.('Conta excluída.', 'success');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isAdding) await addBank({ name, color, last4 });
      else await updateBank(editingBank.id, { name, color, last4 });
      onMessage?.(isAdding ? 'Conta adicionada.' : 'Conta atualizada.', 'success');
      cancelEdit();
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar a conta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Contas e preferências"
      eyebrow="Configurações"
      description="Mantenha seus bancos e cartões organizados."
      onClose={onClose}
      size="large"
    >
      {canManageUsers && (
        <div className="settings-tabs" role="tablist">
          <button type="button" className={activeTab === 'cards' ? 'active' : ''} onClick={() => setActiveTab('cards')}><CreditCard size={16} /> Minhas contas</button>
          <button type="button" className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}><Shield size={16} /> Usuários</button>
        </div>
      )}

      {error && <div className="feedback-message error"><AlertCircle size={18} /><span>{error}</span></div>}

      {activeTab === 'admin' ? <AdminPanel /> : (
        <>
          {(isAdding || editingBank) ? (
            <form className="bank-form" onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="bank-name">Nome da conta ou cartão</label>
                <input id="bank-name" type="text" className="form-control" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Nubank" autoFocus required />
              </div>

              <div className="form-group">
                <label>Cor de identificação</label>
                <div className="color-picker">
                  {COLORS.map(item => (
                    <button
                      type="button"
                      key={item}
                      className={color.toLowerCase() === item.toLowerCase() ? 'selected' : ''}
                      style={{ background: item }}
                      onClick={() => setColor(item)}
                      aria-label={`Usar cor ${item}`}
                    />
                  ))}
                  <label className="custom-color" title="Escolher outra cor">
                    <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />+
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bank-last4">Últimos 4 dígitos <span className="optional">opcional</span></label>
                <input
                  id="bank-last4"
                  type="text"
                  className="form-control"
                  value={last4}
                  onChange={(event) => setLast4(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  placeholder="1234"
                />
              </div>

              <div className="modal-actions compact">
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 className="spin" size={18} /> Salvando...</> : 'Salvar conta'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="settings-section-heading">
                <div><h3>Suas contas</h3><p>{banks.length} {banks.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}</p></div>
                <button type="button" className="btn btn-secondary small" onClick={handleAdd}><Plus size={16} /> Adicionar</button>
              </div>

              <div className="bank-list">
                {banks.map(bank => (
                  <article className="bank-list-item" key={bank.id}>
                    <span className="bank-color" style={{ background: bank.color || '#3267e3' }}><CreditCard size={19} /></span>
                    <div><strong>{bank.name}</strong><span>{bank.last4 ? `Final ${bank.last4}` : 'Sem número informado'}</span></div>
                    <button type="button" className="icon-button ghost" onClick={() => handleEdit(bank)} aria-label={`Editar ${bank.name}`}><Edit3 size={17} /></button>
                    <button type="button" className="icon-button ghost danger" onClick={() => handleDelete(bank)} aria-label={`Excluir ${bank.name}`}><Trash2 size={17} /></button>
                  </article>
                ))}
                {!banks.length && (
                  <div className="empty-state compact"><span><CreditCard size={23} /></span><h4>Nenhuma conta cadastrada</h4><p>Adicione bancos e cartões para organizar os lançamentos.</p></div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
