import { useState } from 'react';
import { useExpense, CATEGORIES } from '../context/ExpenseContext';
import { parseCSV } from '../utils/csvParser';

export default function CsvImportModal({ onClose }) {
  const { banks, addBulkTransactions } = useExpense();
  const [file, setFile] = useState(null);
  const [bankId, setBankId] = useState(banks[0].id);
  const [type, setType] = useState('credit');
  const [error, setError] = useState('');

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      const text = await file.text();
      const rawTxs = parseCSV(text);
      
      // Associa as transações ao banco e tipo selecionados
      const finalTxs = rawTxs.map(t => ({
        ...t,
        bankId,
        type,
        category: 'Outros' // Categoria padrão
      }));

      addBulkTransactions(finalTxs);
      alert(`${finalTxs.length} transações importadas com sucesso!`);
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao ler o arquivo. Verifique o formato.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Importar Extrato (CSV)</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          O CSV deve conter colunas de Data, Valor e Descrição (padrão Nubank/Itaú).
        </p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleImport}>
          <div className="form-group">
            <label>Arquivo .csv</label>
            <input 
              type="file" 
              accept=".csv"
              className="form-control" 
              onChange={e => setFile(e.target.files[0])}
              required 
            />
          </div>

          <div className="form-group">
            <label>Conta de Destino</label>
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
            <label>Foi no Débito ou Crédito?</label>
            <select 
              className="form-control"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="credit">Cartão de Crédito</option>
              <option value="debit">Débito / Pix</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>Importar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
