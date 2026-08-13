export function exportToCSV(transactions, banks) {
  if (!transactions || transactions.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // Header
  const headers = ["Data", "Descrição", "Valor", "Tipo", "Categoria", "Banco"];
  
  // Rows
  const rows = transactions.map(t => {
    const bankName = banks.find(b => b.id === t.bankId)?.name || 'Desconhecido';
    const typeLabel = t.type === 'credit' ? 'Crédito' : t.type === 'income' ? 'Receita' : 'Débito';
    const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
    
    // Ensure description doesn't break CSV if it has commas
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    
    return [dateStr, desc, t.amount, typeLabel, t.category, bankName].join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + "\n" 
    + rows.join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `minhas_financas_export_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
}
