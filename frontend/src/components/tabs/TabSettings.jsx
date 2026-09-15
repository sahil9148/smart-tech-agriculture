import { useState, useEffect } from 'react'
import { Auth } from '../../api.js'

const STATES = ['Andhra Pradesh','Assam','Bihar','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other']

export default function TabSettings({ user, setUser, showToast }) {
  const [form, setForm] = useState({ name: '', phone: '', state: '', district: '', farmSize: '', cropTypes: '' })
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changingPass, setChangingPass] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        state: user.state || '',
        district: user.district || '',
        farmSize: user.farm_size || '',
        cropTypes: user.crop_types || '',
      })
    }
  }, [user])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const updatePass = (k, v) => setPassForm(f => ({ ...f, [k]: v }))

  const saveProfile = async () => {
    if (!form.name) { showToast('Name cannot be empty', 'error'); return }
    setSaving(true)
    try {
      const data = await Auth.updateProfile(form)
      setUser(u => ({ ...u, ...data.user }))
      showToast('Profile saved successfully! ✓')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!passForm.current || !passForm.newPass || !passForm.confirm) { showToast('Fill all password fields', 'error'); return }
    if (passForm.newPass !== passForm.confirm) { showToast('New passwords do not match', 'error'); return }
    if (passForm.newPass.length < 6) { showToast('Password too short (min 6 chars)', 'error'); return }
    setChangingPass(true)
    try {
      await Auth.changePassword({ currentPassword: passForm.current, newPassword: passForm.newPass })
      showToast('Password changed successfully! ✓')
      setPassForm({ current: '', newPass: '', confirm: '' })
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setChangingPass(false)
    }
  }

  const initials = (form.name || user?.name || 'F').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <div className="dash-header"><h1>Settings</h1><p className="dash-sub">Manage your profile and account preferences</p></div>

      <div className="settings-card">
        <h3>👤 Profile Information</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>{form.name || user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{user?.email}</div>
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your full name" /></div>
          <div className="form-group"><label>Email</label><input value={user?.email || ''} disabled /></div>
        </div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group"><label>Phone Number</label><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 9876543210" /></div>
          <div className="form-group"><label>State</label>
            <select value={form.state} onChange={e => update('state', e.target.value)}>
              <option value="">Select state</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group"><label>District</label><input value={form.district} onChange={e => update('district', e.target.value)} placeholder="Your district" /></div>
          <div className="form-group"><label>Farm Size (acres)</label><input type="number" value={form.farmSize} onChange={e => update('farmSize', e.target.value)} placeholder="e.g. 5" min="0" /></div>
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Primary Crops</label>
          <input value={form.cropTypes} onChange={e => update('cropTypes', e.target.value)} placeholder="e.g. Wheat, Rice, Sugarcane" />
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile →'}</button>
      </div>

      <div className="settings-card">
        <h3>🔒 Change Password</h3>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Current Password</label>
          <input type="password" value={passForm.current} onChange={e => updatePass('current', e.target.value)} placeholder="••••••••" />
        </div>
        <div className="form-row" style={{ marginBottom: 20 }}>
          <div className="form-group"><label>New Password</label><input type="password" value={passForm.newPass} onChange={e => updatePass('newPass', e.target.value)} placeholder="Min. 6 characters" /></div>
          <div className="form-group"><label>Confirm New Password</label><input type="password" value={passForm.confirm} onChange={e => updatePass('confirm', e.target.value)} placeholder="Re-enter new password" /></div>
        </div>
        <button className="btn btn-outline" onClick={changePassword} disabled={changingPass}>{changingPass ? 'Updating...' : 'Change Password →'}</button>
      </div>

      <div className="settings-card">
        <h3>🔔 Notification Preferences</h3>
        {[
          ['Weather Alerts', 'Receive severe weather warnings for your location'],
          ['Scheme Updates', 'Get notified when new government schemes launch'],
          ['Market Price Alerts', 'Alert when crop prices hit your target rate'],
          ['Insurance Reminders', 'Premium due dates and claim status updates'],
        ].map(([label, desc]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--bg3)' }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{desc}</div></div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
              <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, background: 'var(--green)', borderRadius: 12, cursor: 'pointer' }} />
            </label>
          </div>
        ))}
      </div>

      <div className="settings-card danger">
        <h3>⚠️ Danger Zone</h3>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 16 }}>Deactivating your account will permanently remove all your farm data, scheme applications, and marketplace listings.</p>
        <button className="btn btn-danger" onClick={() => {
          if (window.confirm('Are you sure? This action cannot be undone.')) {
            showToast('Please contact support to deactivate your account.', 'error')
          }
        }}>Deactivate Account</button>
      </div>
    </>
  )
}
