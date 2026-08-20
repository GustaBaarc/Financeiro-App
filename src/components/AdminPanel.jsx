import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useExpense } from '../context/ExpenseContext';
import { getAuthRedirectUrl } from '../utils/auth';

export default function AdminPanel() {
  const { userProfile } = useExpense();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!active) return;
      if (error) setMessage({ type: 'error', text: `Não foi possível carregar os usuários: ${error.message}` });
      else setProfiles(data || []);
      setLoading(false);
    };
    fetchProfiles();
    return () => { active = false; };
  }, []);

  const handleRoleChange = async (profile, newRole) => {
    if (userProfile.role !== 'master' && newRole === 'master') {
      setMessage({ type: 'error', text: 'Apenas o perfil Master pode promover outro usuário a Master.' });
      return;
    }

    setUpdatingId(profile.id);
    setMessage(null);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    if (error) setMessage({ type: 'error', text: `Não foi possível alterar o acesso: ${error.message}` });
    else {
      setProfiles(previous => previous.map(item => item.id === profile.id ? { ...item, role: newRole } : item));
      setMessage({ type: 'success', text: 'Nível de acesso atualizado.' });
    }
    setUpdatingId('');
  };

  const handleResetPassword = async (profile) => {
    const email = profile.email;
    if (!email) {
      setMessage({ type: 'error', text: 'Este perfil não possui um e-mail disponível para recuperação.' });
      return;
    }
    if (!window.confirm(`Enviar um link de redefinição para ${email}?`)) return;

    setUpdatingId(profile.id);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl('/?recovery=1'),
    });
    setMessage(error
      ? { type: 'error', text: `Não foi possível enviar o e-mail: ${error.message}` }
      : { type: 'success', text: 'E-mail de recuperação enviado.' });
    setUpdatingId('');
  };

  if (!userProfile || !['admin', 'master'].includes(userProfile.role)) {
    return <div className="feedback-message error"><AlertCircle size={18} />Você não tem permissão para acessar esta área.</div>;
  }

  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <span><Shield size={19} /></span>
        <div><h3>Controle de acesso</h3><p>Gerencie permissões e recuperação de conta.</p></div>
      </div>

      {message && (
        <div className={`feedback-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><Loader2 className="spin" size={20} /> Carregando usuários...</div>
      ) : (
        <div className="user-list">
          {profiles.map((profile) => {
            const isSelf = profile.id === userProfile.id;
            const displayName = profile.full_name || profile.name || profile.email || 'Usuário sem nome';
            const lockedMaster = profile.role === 'master' && userProfile.role !== 'master';
            return (
              <article className="user-list-item" key={profile.id}>
                <div className="user-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
                <div className="user-info">
                  <strong>{displayName} {isSelf && <span>Você</span>}</strong>
                  <small>{profile.email || 'E-mail não disponível'}</small>
                </div>
                <select
                  value={profile.role || 'user'}
                  onChange={(event) => handleRoleChange(profile, event.target.value)}
                  disabled={isSelf || lockedMaster || updatingId === profile.id}
                  aria-label={`Nível de acesso de ${displayName}`}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                  {userProfile.role === 'master' && <option value="master">Master</option>}
                </select>
                <button
                  type="button"
                  className="icon-button ghost"
                  onClick={() => handleResetPassword(profile)}
                  disabled={!profile.email || updatingId === profile.id}
                  aria-label={`Redefinir senha de ${displayName}`}
                  title="Enviar link de redefinição"
                >
                  {updatingId === profile.id ? <Loader2 className="spin" size={16} /> : <KeyRound size={16} />}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
