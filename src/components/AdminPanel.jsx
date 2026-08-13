import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useExpense } from '../context/ExpenseContext';
import { Shield, KeyRound } from 'lucide-react';

export default function AdminPanel() {
  const { userProfile } = useExpense();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const handleRoleChange = async (id, newRole) => {
    if (userProfile.role !== 'master' && newRole === 'master') {
      alert("Apenas o Master pode promover alguém a Master.");
      return;
    }

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p));
      alert("Cargo atualizado com sucesso!");
    } else {
      alert("Erro ao atualizar cargo: " + error.message);
    }
  };

  const handleResetPassword = async (email) => {
    if (!email) {
      alert("O usuário precisa ter um email válido no nome.");
      return;
    }
    if (window.confirm(`Enviar email de redefinição de senha para ${email}?`)) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        alert("Erro: " + error.message);
      } else {
        alert("Email de recuperação enviado com sucesso!");
      }
    }
  };

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'master')) {
    return <p style={{color: 'var(--danger)'}}>Você não tem permissão para acessar esta área.</p>;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={20} color="var(--primary)" /> Controle de Acesso
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Aqui você gerencia os usuários. Por segurança, senhas só podem ser alteradas enviando um link de recuperação para o email.
      </p>

      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
        <div className="history-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
          {profiles.map(profile => (
            <div key={profile.id} className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ fontWeight: '600' }}>
                  {profile.name}
                  {profile.id === userProfile.id && <span style={{fontSize: '0.75rem', marginLeft:'0.5rem', color:'var(--success)'}}>(Você)</span>}
                </div>
                <div>
                  <span style={{
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px',
                    background: profile.role === 'master' ? 'rgba(239, 68, 68, 0.2)' : profile.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                    color: profile.role === 'master' ? 'var(--danger)' : profile.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'
                  }}>
                    {profile.role.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                <select 
                  className="form-control"
                  style={{ width: 'auto', padding: '0.3rem', fontSize: '0.85rem' }}
                  value={profile.role}
                  onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                  disabled={profile.id === userProfile.id || (profile.role === 'master' && userProfile.role !== 'master')}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                  {userProfile.role === 'master' && <option value="master">Master</option>}
                </select>

                <button 
                  onClick={() => handleResetPassword(profile.name)}
                  style={{ 
                    background: 'none', 
                    border: '1px solid var(--border)', 
                    color: 'var(--text-main)', 
                    cursor: 'pointer',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  title="Enviar Reset de Senha"
                >
                  <KeyRound size={14} /> Resetar Senha
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
