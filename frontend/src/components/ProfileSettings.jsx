import React, { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { InstagramIcon, LinkedinIcon } from '@hugeicons/core-free-icons';
import { Globe, MessageCircle, MoreHorizontal, Pencil, Plus, X } from 'lucide-react';
import { usersAPI } from '../api/endpoints';
import { uploadFileInChunks } from '../utils/chunkedUpload';
import './ProfileSettings.css';

const P   = '#5B21B6';
const T1  = '#111827';
const T2  = '#6B7280';
const W   = '#FFFFFF';
const BD  = '#E5E7EB';
const BIO_MAX = 300;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCOUNT_TYPES = [
  ['COMMUNITY_MEMBER', 'Community Member'],
  ['INVESTOR', 'Investor'],
  ['FACILITY_OPERATOR', 'Facility Operator'],
  ['GUEST', 'Read-only Guest'],
];
const INTEREST_OPTIONS = ['Solar Energy', 'Battery Storage', 'Renewable Energy', 'Energy Efficiency', 'Clean Energy', 'Sustainability', 'Mini-grids', 'Energy Policy', 'Electric Mobility', 'Climate Finance', 'Wind Energy', 'Green Buildings'];
const SOCIAL_PLATFORMS = [['linkedin', 'LinkedIn'], ['x', 'X'], ['instagram', 'Instagram']];

const normalizeSocialLinks = (user) => Array.isArray(user?.socialLinks) && user.socialLinks.length
  ? user.socialLinks
  : user?.socialLink ? [user.socialLink] : [];

const socialIcon = (url) => {
  const value = String(url || '').toLowerCase();
  if (value.includes('linkedin.com')) return LinkedinIcon;
  if (value.includes('instagram.com')) return InstagramIcon;
  if (value.includes('x.com') || value.includes('twitter.com')) return 'x';
  return null;
};

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

function ProfileSettings({ user = {}, avatarDataUrl = null, onAvatarChange = () => {}, onClose = () => {}, onSaved = () => {}, onMessage = () => {}, readOnly = false }) {
  const initialName = user?.displayName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const [name, setName] = useState(initialName);
  const [accountType, setAccountType] = useState(user?.accountType || 'COMMUNITY_MEMBER');
  const [headline, setHeadline] = useState(user?.occupation || '');
  const [location, setLocation] = useState(user?.address || user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState(Array.isArray(user?.interests) ? user.interests : []);
  const [socialLink, setSocialLink] = useState(user?.socialLink || '');
  const [socialLinks, setSocialLinks] = useState(() => normalizeSocialLinks(user));
  const [newSocialLink, setNewSocialLink] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState('linkedin.com');
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [socialConnecting, setSocialConnecting] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [coverPhoto, setCoverPhoto] = useState(user?.coverPhoto || null);
  const [editOpen, setEditOpen] = useState(false);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [coverChanged, setCoverChanged] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef(null);
  const coverFileRef = useRef(null);
  const headlineInputRef = useRef(null);

  useEffect(() => {
    setName(user?.displayName || user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' '));
    setAccountType(user?.accountType || 'COMMUNITY_MEMBER');
    setHeadline(user?.occupation || '');
    setLocation(user?.address || user?.location || '');
    setBio(user?.bio || '');
    setInterests(Array.isArray(user?.interests) ? user.interests : []);
    setSocialLink(user?.socialLink || '');
    setSocialLinks(normalizeSocialLinks(user));
    setAvatarChanged(false);
    setCoverChanged(false);
    setAvatarFile(null);
    setCoverFile(null);
  }, [user?.id, user?.displayName, user?.name, user?.firstName, user?.lastName, user?.accountType, user?.occupation, user?.address, user?.location, user?.bio, user?.interests, user?.socialLink, user?.socialLinks]);

  useEffect(() => {
    setAvatar(user?.avatar || null);
    setCoverPhoto(user?.coverPhoto || null);
  }, [user?.avatar, user?.coverPhoto]);

  useEffect(() => {
    const handleSocialProfileConnected = async (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'tribes:social-profile-connected') return;
      setSocialConnecting(false);
      if (event.data.result !== 'connected') {
        setMessage({ type: 'error', text: 'Profile connection was cancelled or could not be completed.' });
        return;
      }
      try {
        const response = await usersAPI.getProfile();
        const refreshed = response?.data?.data ?? response?.data ?? {};
        const refreshedName = refreshed.displayName || [refreshed.firstName, refreshed.lastName].filter(Boolean).join(' ');
        setName((value) => value || refreshedName);
        setHeadline((value) => value || refreshed.occupation || '');
        setLocation((value) => value || refreshed.address || '');
        setBio((value) => value || refreshed.bio || '');
        setAvatar((value) => value || refreshed.avatar || null);
        const links = normalizeSocialLinks(refreshed);
        setSocialLinks(links);
        setSocialLink(links[0] || '');
        onSaved?.(refreshed);
        setMessage({ type: 'success', text: 'Profile details imported into empty fields.' });
      } catch {
        setMessage({ type: 'error', text: 'Connected successfully, but the profile could not be refreshed.' });
      }
    };
    window.addEventListener('message', handleSocialProfileConnected);
    return () => window.removeEventListener('message', handleSocialProfileConnected);
  }, [onSaved]);

  const onPickAvatar = () => fileRef.current?.click();

  const handleFile = (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'].includes(f.type) || f.size > MAX_AVATAR_BYTES) {
      setMessage({ type: 'error', text: 'Choose a JPG, PNG, GIF, WebP, or AVIF image smaller than 5 MB.' });
      e.target.value = '';
      return;
    }
    setAvatarFile(f);
    setAvatar(URL.createObjectURL(f));
    setAvatarChanged(true);
    setMessage(null);
    e.target.value = '';
  };

  const handleCoverFile = (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Choose a JPG, PNG, GIF, WebP, or AVIF cover image smaller than 5 MB.' });
      event.target.value = '';
      return;
    }
    setCoverFile(file);
    setCoverPhoto(URL.createObjectURL(file));
    setCoverChanged(true);
    setMessage(null);
    event.target.value = '';
  };

  const toggleInterest = (interest) => {
    setInterests((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest]);
  };

  const saveSection = async (section) => {
    const payload = section === 'about' ? { bio: bio.trim() } : { interests };
    setSectionSaving(true);
    setMessage(null);
    try {
      await usersAPI.updateProfile(payload);
      onSaved?.({ ...user, ...payload });
      window.dispatchEvent(new CustomEvent('tribes:profile-updated', { detail: payload }));
      setEditingSection(null);
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Could not update this section.' });
    } finally {
      setSectionSaving(false);
    }
  };

  const addSocialLink = async () => {
    const value = newSocialLink.trim();
    if (!value) return;
    const profileBase = newSocialPlatform === 'linkedin' ? 'https://www.linkedin.com/in/' : newSocialPlatform === 'x' ? 'https://x.com/' : 'https://www.instagram.com/';
    const normalized = /^https?:\/\//i.test(value) ? value : `${profileBase}${value.replace(/^@/, '')}${newSocialPlatform === 'instagram' ? '/' : ''}`;
    if (socialLinks.includes(normalized)) {
      setMessage({ type: 'error', text: 'That profile is already listed.' });
      return;
    }
    const next = [...socialLinks, normalized];
    setSectionSaving(true);
    try {
      await usersAPI.updateProfile({ socialLinks: next, socialLink: next[0] || '' });
      setSocialLinks(next);
      setSocialLink(next[0] || '');
      setNewSocialLink('');
      setNewSocialPlatform('linkedin.com');
      setShowSocialForm(false);
      onSaved?.({ ...user, socialLinks: next, socialLink: next[0] || '' });
      window.dispatchEvent(new CustomEvent('tribes:profile-updated', { detail: { socialLinks: next, socialLink: next[0] || '' } }));
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Could not add this profile.' });
    } finally {
      setSectionSaving(false);
    }
  };

  const connectSocialProfile = async () => {
    const popup = window.open('about:blank', 'tribes-social-profile', 'popup,width=600,height=720');
    if (!popup) {
      setMessage({ type: 'error', text: 'Allow pop-ups to connect a professional profile.' });
      return;
    }
    setSocialConnecting(true);
    try {
      const response = await usersAPI.connectSocialProfile(newSocialPlatform);
      const authorizeUrl = response?.data?.data?.authorizeUrl || response?.data?.authorizeUrl;
      if (!authorizeUrl) throw new Error('The provider authorization URL is unavailable.');
      popup.location.href = authorizeUrl;
    } catch (error) {
      popup.close();
      setSocialConnecting(false);
      setMessage({ type: 'error', text: error?.response?.data?.message || error?.message || 'Could not start profile connection.' });
    }
  };

  const removeSocialLink = async (url) => {
    const next = socialLinks.filter((item) => item !== url);
    setSectionSaving(true);
    try {
      await usersAPI.updateProfile({ socialLinks: next, socialLink: next[0] || '' });
      setSocialLinks(next);
      setSocialLink(next[0] || '');
      onSaved?.({ ...user, socialLinks: next, socialLink: next[0] || '' });
      window.dispatchEvent(new CustomEvent('tribes:profile-updated', { detail: { socialLinks: next, socialLink: next[0] || '' } }));
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Could not remove this profile.' });
    } finally {
      setSectionSaving(false);
    }
  };

  const save = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setMessage({ type: 'error', text: 'Enter your name before saving.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const nameParts = cleanName.split(/\s+/);
      const payload = {
        displayName: cleanName,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        accountType,
        occupation: headline.trim(),
        address: location.trim(),
        bio: bio.trim(),
        interests,
        socialLink: socialLinks[0] || socialLink.trim(),
        socialLinks,
      };
      if (avatarChanged) {
        payload.avatar = avatarFile
          ? (await uploadFileInChunks(avatarFile, 'profile-avatar', setUploadProgress)).url
          : '';
      }
      if (coverChanged) {
        payload.coverPhoto = coverFile
          ? (await uploadFileInChunks(coverFile, 'profile-cover', setUploadProgress)).url
          : null;
      }

      await usersAPI.updateProfile(payload);
      setAvatar(payload.avatar ?? avatar);
      setCoverPhoto(coverChanged ? payload.coverPhoto : coverPhoto);
      setAvatarFile(null);
      setCoverFile(null);
      setUploadProgress(null);
      setMessage({ type: 'success', text: 'Profile saved.' });
      onSaved?.({ ...payload, name: cleanName, location: payload.address, avatar: avatarChanged ? payload.avatar : avatar, coverPhoto: coverChanged ? payload.coverPhoto : coverPhoto });
      try { window.dispatchEvent(new CustomEvent('tribes:profile-updated', { detail: payload })); } catch {}
      setEditOpen(false);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Save failed. Try again.' });
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  };

  const completion = [Boolean(avatar), Boolean(name.trim()), Boolean(headline.trim()), Boolean(bio.trim()), interests.length >= 5, Boolean(socialLinks.length || socialLink.trim())];
  const completedCount = completion.filter(Boolean).length;
  const completionPercent = Math.round((completedCount / completion.length) * 100);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M';
  const profileSections = [
    ['Add a profile photo', Boolean(avatar)],
    ['Add a headline', Boolean(headline.trim())],
    ['Write a short bio', Boolean(bio.trim())],
    ['Choose at least 5 interests', interests.length >= 5],
    ['Add a social profile', Boolean(socialLinks.length || socialLink.trim())],
  ];

  return (
    <main className={`profile-settings-page${readOnly ? ' read-only' : ''}`}>
      {message && <div className={`profile-save-notice ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</div>}
      <section className="profile-hero-card">
        <div className="profile-cover" style={coverPhoto ? { backgroundImage: `url("${coverPhoto}")` } : undefined}>
          {!readOnly && <button type="button" className="profile-cover-edit" aria-label="Edit cover photo" title="Edit cover photo" onClick={() => coverFileRef.current?.click()}><Pencil size={15} /></button>}
          <input ref={coverFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" hidden onChange={handleCoverFile} />
        </div>
        <div className="profile-identity">
          <div className="profile-identity-main">
            <div className="profile-photo-wrap"><div className="profile-photo">{avatar ? <img src={avatar} alt={`${name || 'Member'} profile`} /> : <span>{initials}</span>}</div><button type="button" className="profile-photo-edit" aria-label="Edit profile photo" title="Edit profile photo" onClick={() => { setEditOpen(true); window.setTimeout(() => fileRef.current?.click(), 0); }}><Pencil size={13} /></button></div>
            <div className="profile-identity-copy"><div className="profile-name-row"><h1>{name || 'Your name'}</h1></div>{headline && <div className="profile-headline-row"><p>{headline}</p></div>}<div className="profile-meta">{location && <span>{location}</span>}{user?.createdAt && <span>Member since {new Date(user.createdAt).getFullYear()}</span>}</div>{!readOnly && <div className="profile-hero-actions"><button type="button" className="profile-message-button" onClick={onMessage}><MessageCircle size={15} />Message</button>{socialLinks[0] ? <a className="profile-website-button" href={/^https?:\/\//i.test(socialLinks[0]) ? socialLinks[0] : `https://${socialLinks[0]}`} target="_blank" rel="noreferrer"><Globe size={15} />Visit my website</a> : <button type="button" className="profile-website-button" onClick={() => setEditOpen(true)} title="Add a professional link to enable this action"><Globe size={15} />Visit my website</button>}<button type="button" className="profile-more-button" onClick={() => setEditOpen(true)}><MoreHorizontal size={17} />More</button></div>}{readOnly && socialLinks[0] && <div className="profile-hero-actions"><a className="profile-website-button" href={/^https?:\/\//i.test(socialLinks[0]) ? socialLinks[0] : `https://${socialLinks[0]}`} target="_blank" rel="noreferrer"><Globe size={15} />Visit my website</a></div>}</div>
          </div>
          <aside className="profile-affiliations" aria-label="Profile details">
            <div><img className="profile-detail-mark profile-brand-mark" src="/image.png" alt="" aria-hidden="true" /><span><strong>Community Member</strong><small>Account type</small></span></div>
            {location && <div><span className="profile-detail-mark">⌖</span><span><strong>{location}</strong><small>Location</small></span></div>}
          </aside>
        </div>
      </section>

      <div className="profile-settings-grid">
        <div className="profile-settings-main">
          <section className={`profile-section${editingSection === 'about' ? ' editing' : ''}`} onClick={() => { if (!readOnly && !editingSection) setEditingSection('about'); }} onKeyDown={(event) => { if (!readOnly && !editingSection && ['Enter', ' '].includes(event.key)) setEditingSection('about'); }} tabIndex={readOnly ? -1 : 0}>
            <header><h3>About</h3>{!readOnly && <button type="button" className="profile-section-edit" onClick={(event) => { event.stopPropagation(); setEditingSection('about'); }}>Edit</button>}</header>
            {editingSection === 'about' && !readOnly ? <><textarea className="profile-inline-editor" value={bio} maxLength={BIO_MAX} onClick={(event) => event.stopPropagation()} onChange={(event) => setBio(event.target.value)} placeholder="Share your experience and what you are working on." /><div className="profile-inline-actions"><button type="button" className="profile-text-button" onClick={(event) => { event.stopPropagation(); setBio(user?.bio || ''); setEditingSection(null); }}>Cancel</button><button type="button" className="profile-inline-save" disabled={sectionSaving} onClick={(event) => { event.stopPropagation(); void saveSection('about'); }}>{sectionSaving ? 'Saving…' : 'Save'}</button></div></> : <p>{bio || (readOnly ? 'No introduction added.' : 'Add a short introduction so other members can learn about you.')}</p>}
          </section>
          <section className={`profile-section${editingSection === 'interests' ? ' editing' : ''}`} onClick={() => { if (!readOnly && !editingSection) setEditingSection('interests'); }} onKeyDown={(event) => { if (!readOnly && !editingSection && ['Enter', ' '].includes(event.key)) setEditingSection('interests'); }} tabIndex={readOnly ? -1 : 0}>
            <header><h3>Energy interests</h3>{!readOnly && <button type="button" className="profile-section-edit" onClick={(event) => { event.stopPropagation(); setEditingSection('interests'); }}>Edit</button>}</header>
            {editingSection === 'interests' && !readOnly ? <><div className="profile-interest-list">{INTEREST_OPTIONS.map((interest) => { const selected = interests.includes(interest); return <button type="button" key={interest} aria-pressed={selected} className={`profile-interest-option${selected ? ' selected' : ''}`} onClick={(event) => { event.stopPropagation(); toggleInterest(interest); }}>{interest}</button>; })}</div><div className="profile-inline-actions"><button type="button" className="profile-text-button" onClick={(event) => { event.stopPropagation(); setInterests(Array.isArray(user?.interests) ? user.interests : []); setEditingSection(null); }}>Cancel</button><button type="button" className="profile-inline-save" disabled={sectionSaving} onClick={(event) => { event.stopPropagation(); void saveSection('interests'); }}>{sectionSaving ? 'Saving…' : 'Save'}</button></div></> : interests.length ? <div className="profile-interest-list">{interests.map((interest) => <span className="profile-interest" key={interest}>{interest}</span>)}</div> : <p>{readOnly ? 'No interests shared yet.' : 'Choose the topics you follow across clean energy and sustainability.'}</p>}
          </section>
          <section id="profile-social-section" className="profile-section profile-social-section"><header><h3>Professional profiles</h3></header>
            <div className="profile-social-links">{socialLinks.map((url) => { const PlatformIcon = socialIcon(url); return <div className="profile-social-item" key={url}><a href={/^https?:\/\//i.test(url) ? url : `https://${url}`} target="_blank" rel="noreferrer" aria-label={`Open ${url}`} title={url}>{PlatformIcon === 'x' ? <X size={17} /> : PlatformIcon ? <HugeiconsIcon icon={PlatformIcon} size={17} color="currentColor" strokeWidth={2} /> : <Globe size={17} />}<span>{url.includes('linkedin.com') ? 'LinkedIn' : url.includes('instagram.com') ? 'Instagram' : url.includes('x.com') || url.includes('twitter.com') ? 'X' : 'Website'}</span></a>{!readOnly && <button type="button" onClick={() => void removeSocialLink(url)} disabled={sectionSaving} aria-label={`Remove ${url}`} title="Remove profile"><X size={13} /></button>}</div>; })}</div>
            {!readOnly && showSocialForm && <div className="profile-social-add-form"><label><span>Professional platform</span><select value={newSocialPlatform} onChange={(event) => setNewSocialPlatform(event.target.value)}>{SOCIAL_PLATFORMS.map(([provider, label]) => <option key={provider} value={provider}>{label}</option>)}</select></label><button type="button" className="profile-inline-save" disabled={socialConnecting} onClick={() => void connectSocialProfile()}>{socialConnecting ? 'Waiting for authorization…' : 'Connect and import'}</button><label><span>Or add profile URL</span><input value={newSocialLink} onChange={(event) => setNewSocialLink(event.target.value)} placeholder="Profile URL or username" /></label><button type="button" className="profile-inline-save" disabled={sectionSaving || !newSocialLink.trim()} onClick={() => void addSocialLink()}>{sectionSaving ? 'Saving…' : 'Add manually'}</button></div>}
            {!readOnly && <button type="button" className="profile-social-add" aria-label="Add professional profile" title="Add professional profile" onClick={() => setShowSocialForm((visible) => !visible)}><Plus size={17} /><span>Add profile</span></button>}
          </section>
        </div>
        {!readOnly && <aside className="profile-completion-card"><div className="profile-completion-header"><div><span className="profile-eyebrow">Profile strength</span><h3>{completionPercent}% complete</h3></div><span className="profile-completion-number">{completedCount}/{completion.length}</span></div><div className="profile-progress"><span style={{ width: `${completionPercent}%` }} /></div><div className="profile-completion-list">{profileSections.map(([label, done]) => <div className={`profile-completion-item${done ? ' done' : ''}`} key={label}><span aria-hidden="true">{done ? '✓' : ''}</span>{label}</div>)}</div></aside>}
      </div>

      {editOpen && !readOnly && <div className="profile-edit-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditOpen(false); }}>
        <section className="profile-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
          <header><div><span className="profile-eyebrow">Profile details</span><h2 id="profile-edit-title">Edit profile</h2></div><button type="button" className="profile-dialog-close" onClick={() => setEditOpen(false)} aria-label="Close edit profile">×</button></header>
          <div className="profile-edit-body">
            <div className="profile-avatar-editor"><div className="profile-photo large">{avatar ? <img src={avatar} alt="Profile preview" /> : <span>{initials}</span>}</div><div><strong>Profile photo</strong><p>Use a clear image so other members recognize you.</p><div className="profile-avatar-actions"><button type="button" className="profile-secondary-button" onClick={onPickAvatar}>Change photo</button><button type="button" className="profile-text-button" onClick={() => { setAvatar(null); setAvatarFile(null); setAvatarChanged(true); }}>Remove</button></div></div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" hidden onChange={handleFile} /></div>
            <div className="profile-avatar-editor"><div className="profile-cover-preview" style={coverPhoto ? { backgroundImage: `url("${coverPhoto}")` } : undefined} /><div><strong>Cover photo</strong><p>Choose a wide image for the top of your profile.</p><div className="profile-avatar-actions"><button type="button" className="profile-secondary-button" onClick={() => coverFileRef.current?.click()}>Change cover</button>{coverPhoto && <button type="button" className="profile-text-button" onClick={() => { setCoverPhoto(null); setCoverFile(null); setCoverChanged(true); }}>Remove</button>}</div></div></div>
            <label className="profile-field"><span>Display name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" /></label>
            <label className="profile-field"><span>Account type</span><select value={accountType} onChange={(event) => setAccountType(event.target.value)}>{ACCOUNT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="profile-field"><span>Professional headline</span><input ref={headlineInputRef} value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={120} placeholder="e.g. Solar energy entrepreneur" /></label>
            <label className="profile-field"><span>Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} placeholder="City, country" autoComplete="address-level2" /></label>
            <label className="profile-field"><span>About <small>{bio.length}/{BIO_MAX}</small></span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={BIO_MAX} rows={4} placeholder="Share your experience and what you are working on." /></label>
            <fieldset className="profile-field profile-interest-field"><legend>Energy interests <small>{interests.length} selected</small></legend><div className="profile-interest-list">{INTEREST_OPTIONS.map((interest) => { const selected = interests.includes(interest); return <button type="button" key={interest} aria-pressed={selected} className={`profile-interest-option${selected ? ' selected' : ''}`} onClick={() => toggleInterest(interest)}>{interest}</button>; })}</div></fieldset>
            <label className="profile-field"><span>Professional profile links</span><input value={socialLinks.join(', ')} onChange={(event) => setSocialLinks(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} maxLength={1000} placeholder="linkedin.com/in/yourname, github.com/username" autoComplete="url" /></label>
            {message?.type === 'error' && <div className="profile-save-notice error" role="alert">{message.text}</div>}
          </div>
          <footer>{uploadProgress && <div className="profile-upload-progress" role="status"><span>Uploading {uploadProgress.percent}%</span><progress value={uploadProgress.percent} max="100" /></div>}<button type="button" className="profile-secondary-button" disabled={saving} onClick={() => setEditOpen(false)}>Cancel</button><button type="button" className="profile-save-button" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save profile'}</button></footer>
        </section>
      </div>}
      {onClose && <button type="button" className="profile-back-button" onClick={onClose}>Back</button>}
    </main>
  );
}

export function PublicProfilePage({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    usersAPI.getById(userId)
      .then((response) => { if (!cancelled) setProfile(response?.data?.data ?? response?.data ?? null); })
      .catch((requestError) => { if (!cancelled) setError(requestError?.response?.data?.message || 'Unable to load this profile.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <main className="profile-settings-page" role="status">Loading profile…</main>;
  if (error || !profile) return <main className="profile-settings-page"><p role="alert">{error || 'This profile could not be found.'}</p><button type="button" className="profile-secondary-button" onClick={onClose}>Back to messages</button></main>;
  return <ProfileSettings key={profile.id} user={profile} readOnly onClose={onClose} />;
}

export default ProfileSettings;
