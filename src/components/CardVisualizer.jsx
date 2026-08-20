import { CreditCard, Plus, Wifi } from 'lucide-react';
import { isSameMonth } from 'date-fns';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/format';

const darkenHex = (hex) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#14213d';
  const value = hex.slice(1).match(/.{2}/g).map(part => Math.max(0, Math.round(parseInt(part, 16) * 0.62)));
  return `#${value.map(part => part.toString(16).padStart(2, '0')).join('')}`;
};

const getBankBackground = (bank) => {
  if (bank.color?.includes('gradient')) return bank.color;
  if (bank.color) return `linear-gradient(145deg, ${bank.color}, ${darkenHex(bank.color)})`;

  const name = bank.name.toLowerCase();
  if (name.includes('nubank')) return 'linear-gradient(145deg, #9c2ac8, #4c0862)';
  if (name.includes('itau') || name.includes('itaú')) return 'linear-gradient(145deg, #ff8a1f, #b84100)';
  if (name.includes('inter')) return 'linear-gradient(145deg, #ff7a00, #b43d00)';
  if (name.includes('bradesco')) return 'linear-gradient(145deg, #e21c4c, #76071e)';
  if (name.includes('santander')) return 'linear-gradient(145deg, #f12c32, #8b0710)';
  return 'linear-gradient(145deg, #3267e3, #152a66)';
};

export default function CardVisualizer({ onManage }) {
  const { banks, transactions, selectedMonth } = useExpense();

  const getBankStats = (bankId) => {
    const bankTransactions = transactions.filter(transaction => (
      String(transaction.bankId) === String(bankId)
      && transaction.status !== 'pending'
      && isSameMonth(new Date(transaction.date), selectedMonth)
    ));
    return {
      credit: bankTransactions.filter(transaction => transaction.type === 'credit').reduce((total, item) => total + Number(item.amount || 0), 0),
      debit: bankTransactions.filter(transaction => transaction.type === 'debit').reduce((total, item) => total + Number(item.amount || 0), 0),
    };
  };

  if (!banks.length) {
    return (
      <div className="accounts-empty">
        <span><CreditCard size={24} /></span>
        <h3>Adicione sua primeira conta</h3>
        <p>Organize cartões e bancos para entender de onde cada gasto veio.</p>
        <button type="button" className="btn btn-secondary" onClick={onManage}><Plus size={17} /> Criar conta</button>
      </div>
    );
  }

  return (
    <div className="card-stack">
      {banks.map((bank) => {
        const stats = getBankStats(bank.id);
        return (
          <article key={bank.id} className="credit-card" style={{ background: getBankBackground(bank) }}>
            <div className="card-glow" />
            <div className="card-topline">
              <div><span>Conta digital</span><h3>{bank.name}</h3></div>
              <Wifi size={23} />
            </div>
            <div className="card-chip"><i /><i /><i /></div>
            <div className="card-number">•••• &nbsp;•••• &nbsp;•••• &nbsp;{bank.last4 || '0000'}</div>
            <div className="card-stats">
              <div><span>Crédito no mês</span><strong>{formatCurrency(stats.credit)}</strong></div>
              <div><span>Débito no mês</span><strong>{formatCurrency(stats.debit)}</strong></div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
