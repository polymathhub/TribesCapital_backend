import React, { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../api/endpoints';

const P   = '#5B21B6';
const T1  = '#111827';
const T2  = '#6B7280';
const W   = '#FFFFFF';
const BD  = '#E5E7EB';

const btnStyle = (border, bg, color, fs) => ({
  border, background: bg, color, fontSize: fs,
  cursor:'pointer', fontFamily:'inherit', fontWeight:400, padding:0,
});

const glassCardStyle = (radius = 12, padding = '14px') => ({
  background: W,
  border: `1px solid ${BD}`,
  borderRadius: radius,
  boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
  padding,
});

function ProfileSettings({ user = {}, avatarDataUrl = null, onAvatarChange = () => {}, onClose = () => {}, onSaved = () => {} }) {
  const [name, setName] = useState(user?.name || user?.firstName || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setName(user?.name || user?.firstName || '');
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setBio(user?.bio || '');
  }, [user?.id]);

  const onPickAvatar = () => fileRef.current?.click();

  const handleFile = (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      try { window.localStorage.setItem('tribes-avatar', url); } catch {}
      setSelectedFile(f);
      onAvatarChange?.({ target: { files: [f] }, dataUrl: url });
    };
    reader.readAsDataURL(f);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = { name: name || `${firstName || ''} ${lastName || ''}`.trim() || undefined, firstName: firstName || undefined, lastName: lastName || undefined, bio: bio || undefined };

      // If a file was selected, attempt backend upload first and include returned URL
      if (selectedFile) {
        try {
          const fd = new FormData();
          fd.append('avatar', selectedFile);
          const res = await usersAPI.uploadAvatar(fd).catch(() => null);
          const avatarUrl = res?.data?.url || res?.data?.avatarUrl || res?.data?.avatar || null;
          if (avatarUrl) payload.avatar = avatarUrl;
        } catch (e) {
          // ignore upload failure and continue with profile PATCH
        }
      }

      await usersAPI.updateProfile(payload);
      setMessage({ type: 'success', text: 'Profile saved.' });
      onSaved?.(payload);
      // emit a cross-window event so other parts of the app can refresh if needed
      try { window.dispatchEvent(new CustomEvent('tribes:profile-updated', { detail: payload })); } catch {}
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed. Try again.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div style={{ width:'100%', maxWidth:920, margin:'0 auto', padding:'20px' }}>
      <div style={glassCardStyle(14, '20px')}>
        <h2 style={{ margin:0, fontSize:18, color:T1, fontWeight:700 }}>Profile settings</h2>
        <p style={{ margin:'6px 0 14px', color:T2 }}>Update your display name, avatar, and a short bio. Changes save to your account.</p>

        <div style={{ display:'flex', gap:18, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ width:180, minWidth:180 }}>
            <div style={{ width:120, height:120, borderRadius:16, overflow:'hidden', marginBottom:10, background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src={avatarDataUrl || '/assets/illustrations/Artist Woman (1).png'} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" onClick={onPickAvatar} style={{ ...btnStyle('none', P, W, 13), padding:'8px 12px', borderRadius:10 }}>Change</button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={(e) => { handleFile(e); onAvatarChange?.(e); }} />
              <button type="button" onClick={() => { try { window.localStorage.removeItem('tribes-avatar'); onAvatarChange?.({ target:{ files:[] }, dataUrl: null }); } catch {} }} style={{ ...btnStyle(`1px solid ${BD}`, W, T2, 13), padding:'8px 12px', borderRadius:10 }}>Remove</button>
            </div>
          </div>

          <div style={{ flex:1, minWidth:260 }}>
            <label style={{ display:'block', fontSize:12, color:T2, marginBottom:6 }}>Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preferred display name (e.g., Jane Doe)" style={{ width:'100%', padding:'10px 12px', border:`1px solid ${BD}`, borderRadius:10, fontSize:14, marginBottom:12 }} />

            <div style={{ display:'flex', gap:10, marginBottom:12 }}>
              <div style={{ flex:1 }}>
                <label style={{ display:'block', fontSize:12, color:T2, marginBottom:6 }}>First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" style={{ width:'100%', padding:'10px 12px', border:`1px solid ${BD}`, borderRadius:10, fontSize:14 }} />
              </div>
              <div style={{ width:160 }}>
                <label style={{ display:'block', fontSize:12, color:T2, marginBottom:6 }}>Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" style={{ width:'100%', padding:'10px 12px', border:`1px solid ${BD}`, borderRadius:10, fontSize:14 }} />
              </div>
            </div>

            <label style={{ display:'block', fontSize:12, color:T2, marginBottom:6 }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief professional bio — job title, core expertise, and company (2–3 lines)" style={{ width:'100%', minHeight:96, padding:'10px 12px', border:`1px solid ${BD}`, borderRadius:10, fontSize:14, marginBottom:12 }} />

            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button type="button" onClick={save} disabled={saving} style={{ ...btnStyle('none', P, W, 14), padding:'10px 16px', borderRadius:10, fontWeight:700 }}>{saving ? 'Saving…' : 'Save profile'}</button>
              <button type="button" onClick={() => { setName(user?.name || ''); setFirstName(user?.firstName || ''); setLastName(user?.lastName || ''); setBio(user?.bio || ''); }} style={{ ...btnStyle(`1px solid ${BD}`, W, T2, 13), padding:'10px 14px', borderRadius:10 }}>Reset</button>
              {message && (
                <div style={{ color: message.type === 'error' ? '#DC2626' : '#059669', fontSize:13 }}>{message.text}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSettings;
