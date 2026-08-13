import { useState } from 'react';
import { useExpense, CATEGORIES } from '../context/ExpenseContext';

export default function TransactionModal({ onClose, initialData }) {
  const { banks, addTransaction, addBulkTransactions, updateTransaction } = useExpense();
  
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [bankId, setBankId] = useState(initialData?.bankId || banks[0].id);
  const [type, setType] = useState(initialData?.type || 'credit');
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [installments, setInstallments] = useState(initialData?.installments || 1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [status, setStatus] = useState(initialData?.status || 'confirmed');
  
  // Formata a data inicial no formato YYYY-MM-DD
  const [date, setDate] = useState(
    initialData?.date 
      ? new Date(initialData.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  
  const isEditing = !!initialData?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    
    // Cria a data base no meio do dia para evitar problemas de fuso horário movendo o dia
    const baseDate = new Date(`${date}T12:00:00`);

    if (isEditing) {
      updateTransaction(initialData.id, {
        description,
        amount: parsedAmount,
        bankId,
        type,
        category,
        status,
        date: baseDate.toISOString()
      });
    } else if (isRecurring) {
      const newTransactions = [];
      const currentDate = new Date(baseDate);
      
      for (let i = 0; i < 12; i++) {
        const iterDate = new Date(currentDate);
        iterDate.setMonth(currentDate.getMonth() + i);
        
        newTransactions.push({
          description,
          amount: parsedAmount,
          bankId,
          type,
          category,
          date: iterDate.toISOString(),
          status: i === 0 ? status : 'pending',
          id: Date.now().toString() + Math.random() + i
        });
      }
      addBulkTransactions(newTransactions);
    } else if (type === 'credit' && installments > 1) {
      const installmentAmount = parsedAmount / installments;
      const newTransactions = [];
      const currentDate = new Date(baseDate);
      
      for (let i = 0; i < installments; i++) {
        const iterDate = new Date(currentDate);
        iterDate.setMonth(currentDate.getMonth() + i);
        
        newTransactions.push({
          description: `${description} (${i + 1}/${installments})`,
          amount: parseFloat(installmentAmount.toFixed(2)),
          bankId,
          type,
          category,
          date: iterDate.toISOString(),
          status,
          id: Date.now().toString() + Math.random() + i
        });
      }
      addBulkTransactions(newTransactions);
    } else {
      addTransaction({
        description,
        amount: parsedAmount,
        bankId,
        type,
        category,
        status,
        date: baseDate.toISOString()
      });
    }
    
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{isEditing ? 'Editar Transação' : 'Nova Transação'}</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          
          <div className="form-group">
            <label>Descrição</label>
            <input 
              type="text" 
              className="form-control" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Data</label>
              <input 
                type="date" 
                className="form-control" 
                value={date}
                onChange={e => setDate(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Banco</label>
            <select 
              className="form-control"
              value={bankId}
              onChange={e => setBankId(e.target.value)}
            >
              {banks.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de Transação</label>
            <select 
              className="form-control"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="credit">Despesa (Cartão de Crédito)</option>
              <option value="debit">Despesa (Débito / Pix)</option>
              <option value="income">Receita (Entrada)</option>
            </select>
          </div>

          {type === 'credit' && !isRecurring && (
            <div className="form-group">
              <label>Parcelas (1 para pagamento à vista)</label>
              <input 
                type="number" 
                min="1"
                max="48"
                className="form-control" 
                value={installments}
                onChange={e => setInstallments(parseInt(e.target.value) || 1)}
                required 
                disabled={isEditing}
              />
            </div>
          )}

          {!isEditing && type === 'income' && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="recurring" 
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
              />
              <label htmlFor="recurring" style={{ margin: 0, cursor: 'pointer' }}>
                Repetir mensalmente (gera 12 meses pendentes)
              </label>
            </div>
          )}

          {isEditing && (
            <div className="form-group">
              <label>Status</label>
              <select 
                className="form-control"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="confirmed">Confirmado / Pago</option>
                <option value="pending">Pendente / Previsto</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Categoria</label>
            <select 
              className="form-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
