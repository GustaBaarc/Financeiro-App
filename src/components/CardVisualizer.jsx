import { useExpense } from '../context/ExpenseContext';
import { isSameMonth } from 'date-fns';

export default function CardVisualizer() {
  const { banks, transactions, selectedMonth } = useExpense();

  const getBankStats = (bankId) => {
    const bankTxs = transactions.filter(t => t.bankId === bankId && isSameMonth(new Date(t.date), selectedMonth));
    const credit = bankTxs.filter(t => t.type === 'credit').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const debit = bankTxs.filter(t => t.type === 'debit').reduce((acc, curr) => acc + Number(curr.amount), 0);
    return { credit, debit };
  };

  const getBankGradient = (bank) => {
    if (bank.color) return bank.color; // Se já tiver cor salva, usa ela
    
    const name = bank.name.toLowerCase();
    if (name.includes('nubank')) return 'linear-gradient(135deg, #8A05BE 0%, #610386 100%)';
    if (name.includes('itau') || name.includes('itaú')) return 'linear-gradient(135deg, #EC7000 0%, #FF9900 100%)';
    if (name.includes('inter')) return 'linear-gradient(135deg, #FF7A00 0%, #FF9A3D 100%)';
    if (name.includes('bradesco')) return 'linear-gradient(135deg, #CC092F 0%, #FD244C 100%)';
    if (name.includes('santander')) return 'linear-gradient(135deg, #EC0000 0%, #CC0000 100%)';
    if (name.includes('brasil') || name.includes('bb')) return 'linear-gradient(135deg, #FBE000 0%, #E3CB00 100%)';
    if (name.includes('caixa')) return 'linear-gradient(135deg, #005CA9 0%, #0077D9 100%)';
    
    // Default gradient para outros cartões (azul escuro elegante)
    return 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)';
  };

  return (
    <div className="card-stack">
      {banks.map(bank => {
        const stats = getBankStats(bank.id);
        return (
          <div 
            key={bank.id} 
            className="credit-card" 
            style={{ background: getBankGradient(bank) }}
          >
            <div className="card-header">
              <h3 style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{bank.name}</h3>
              <span style={{opacity: 0.9, fontSize: '0.8rem', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>Conta & Cartão</span>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Fatura (Crédito)</div>
                <div style={{ fontWeight: 'bold' }}>R$ {stats.credit.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Gasto (Débito)</div>
                <div style={{ fontWeight: 'bold' }}>R$ {stats.debit.toFixed(2)}</div>
              </div>
            </div>

            <div className="card-body" style={{ marginTop: 'auto' }}>
              <div className="card-number" style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                **** **** **** {bank.last4}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
