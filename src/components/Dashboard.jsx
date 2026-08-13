import { useExpense } from '../context/ExpenseContext';
import { format, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, ChevronLeft, ChevronRight, Edit2, Clock } from 'lucide-react';

export default function Dashboard({ onEdit }) {
  const { transactions, banks, deleteTransaction, selectedMonth, setSelectedMonth } = useExpense();

  const monthTxs = transactions.filter(t => isSameMonth(new Date(t.date), selectedMonth));

  const handleMonthChange = (e) => {
    if (e.target.value) {
      const [year, month] = e.target.value.split('-');
      const newDate = new Date(selectedMonth);
      newDate.setFullYear(parseInt(year));
      newDate.setMonth(parseInt(month) - 1);
      setSelectedMonth(newDate);
    }
  };

  const monthlyTotal = monthTxs
    .filter(t => t.type !== 'income' && t.status !== 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const monthlyIncome = monthTxs
    .filter(t => t.type === 'income' && t.status !== 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const balance = monthlyIncome - monthlyTotal;

  // Projected Balance (including pending)
  const projectedTotal = monthTxs
    .filter(t => t.type !== 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const projectedIncome = monthTxs
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const projectedBalance = projectedIncome - projectedTotal;

  // Category breakdown
  const categoryTotals = monthTxs
    .filter(t => t.type !== 'income')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {});
  
  const categoriesArray = Object.keys(categoryTotals).map(key => ({
    name: key,
    amount: categoryTotals[key],
    percentage: monthlyTotal > 0 ? (categoryTotals[key] / monthlyTotal) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  const getBankName = (id) => banks.find(b => b.id === id)?.name || 'Desconhecido';

  return (
    <div>
      <div className="dash-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn-icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
          <ChevronLeft />
        </button>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input 
            type="month" 
            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
            onChange={handleMonthChange}
            className="month-input-visible"
            title="Escolha o mês"
          />
        </div>
        <button className="btn-icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
          <ChevronRight />
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="dash-widget">
          <div className="widget-title">Receitas (Mês)</div>
          <div className="widget-value text-success" style={{ color: '#10b981' }}>
            R$ {monthlyIncome.toFixed(2)}
          </div>
        </div>
        <div className="dash-widget">
          <div className="widget-title">Despesas (Mês)</div>
          <div className="widget-value text-danger">
            R$ {monthlyTotal.toFixed(2)}
          </div>
        </div>
        <div className="dash-widget">
          <div className="widget-title">Saldo Real</div>
          <div className="widget-value" style={{ color: balance >= 0 ? '#10b981' : 'var(--danger)' }}>
            R$ {balance.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
            Previsto: R$ {projectedBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {categoriesArray.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Gastos por Categoria</h3>
          <div className="category-bars">
            {categoriesArray.map(cat => (
              <div key={cat.name} style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span>{cat.name}</span>
                  <span>R$ {cat.amount.toFixed(2)} ({cat.percentage.toFixed(1)}%)</span>
                </div>
                <div className="progress-bg" style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div className="progress-fill" style={{ width: `${cat.percentage}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Histórico Recente</h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma despesa registrada.</p>
        ) : (
          <div className="history-list">
            {monthTxs.slice(0, 15).map(t => (
              <div key={t.id} className={`history-item ${t.status === 'pending' ? 'history-item-pending' : ''}`}>
                <div className="history-details">
                  <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t.status === 'pending' && <Clock size={14} color="#f59e0b" />}
                    {t.description}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {getBankName(t.bankId)} • {t.type === 'credit' ? 'Crédito' : t.type === 'income' ? 'Receita' : 'Débito'} • {t.category}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 'bold', color: t.type === 'income' ? '#10b981' : 'inherit' }}>
                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => onEdit(t)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteTransaction(t.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
