import { useState, useEffect, useRef, useCallback } from 'react';
import {
  auth, getToken, setToken, clearToken,
  usersApi, productsApi, quotesApi, galleryApi,
  blogApi, teamApi, testimonialsApi, positionsApi,
  partnersApi, settingsApi
} from './api.js';

// ── THEME ──
const C = {
  bg:     '#061428', surf:  '#0A1E3D', border:'#123068',
  text:   '#E8EEF8', muted: '#4E6A99', blue:  '#0A4DA6',
  amber:  '#F5A623', green: '#22C55E', red:   '#EF4444',
  white:  '#FFFFFF', dark:  '#062E6F',
};
const sans = "'DM Sans', sans-serif";
const BASE_URL = import.meta.env.VITE_API_URL || 'https://solarise.vintechafrica.com';

// ── HELPERS ──
const imgSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};

// ── SHARED COMPONENTS ──

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
      <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.amber}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'error' ? C.red : type === 'warn' ? C.amber : C.green;
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:bg, color:C.white, padding:'12px 20px', borderRadius:6, fontFamily:sans, fontSize:14, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.4)', maxWidth:360 }}>
      {msg}
      <span onClick={onClose} style={{ marginLeft:12, cursor:'pointer', opacity:0.7 }}>×</span>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = 'success') => setToast({ msg, type }), []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}

function Btn({ children, onClick, color = C.amber, textColor = C.dark, size = 'sm', disabled, style: s }) {
  const pad = size === 'lg' ? '12px 28px' : size === 'md' ? '9px 20px' : '6px 14px';
  const fs = size === 'lg' ? 15 : size === 'md' ? 13 : 12;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? C.border : color, color: disabled ? C.muted : textColor, padding: pad, borderRadius:4, border:'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily:sans, fontSize:fs, fontWeight:700, transition:'opacity 0.15s', ...s }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type='text', placeholder, required, rows }) {
  const s = { width:'100%', boxSizing:'border-box', background:C.bg, border:`1px solid ${C.border}`, color:C.text, padding:'9px 12px', borderRadius:4, fontSize:13, fontFamily:sans, outline:'none', marginTop:4 };
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1.5, fontFamily:sans }}>{label}{required && ' *'}</label>}
      {rows
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...s, resize:'vertical' }}/>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={s}/>
      }
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1.5, fontFamily:sans }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', marginTop:4, background:C.bg, border:`1px solid ${C.border}`, color:C.text, padding:'9px 12px', borderRadius:4, fontSize:13, fontFamily:sans, outline:'none' }}>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, width, maxWidth:'100%', maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:`1px solid ${C.border}` }}>
          <span style={{ color:C.text, fontWeight:700, fontSize:16, fontFamily:sans }}>{title}</span>
          <span onClick={onClose} style={{ color:C.muted, cursor:'pointer', fontSize:22, lineHeight:1 }}>×</span>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

function ImageUploadField({ label, value, onChange }) {
  const ref = useRef();
  const [preview, setPreview] = useState(value || null);
  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setPreview(reader.result); onChange(file, reader.result); };
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1.5, fontFamily:sans, display:'block', marginBottom:6 }}>{label}</label>}
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <div onClick={() => ref.current.click()} style={{ width:80, height:80, borderRadius:6, background:C.bg, border:`2px dashed ${preview ? C.amber : C.border}`, overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {preview
            ? <img src={preview.startsWith('data:') ? preview : imgSrc(preview)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <span style={{ color:C.muted, fontSize:22 }}>📷</span>
          }
        </div>
        <div>
          <Btn onClick={() => ref.current.click()} color="rgba(96,168,255,0.15)" textColor="#60A8FF">
            {preview ? '📁 Change' : '📁 Upload'}
          </Btn>
          <div style={{ color:C.muted, fontSize:11, marginTop:4, fontFamily:sans }}>JPG, PNG, WebP — max 10MB</div>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }}/>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
      <div>
        <h2 style={{ fontFamily:sans, color:C.text, fontSize:24, margin:'0 0 4px', fontWeight:700 }}>{title}</h2>
        {subtitle && <p style={{ color:C.muted, fontSize:13, margin:0, fontFamily:sans }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div style={{ padding:48, textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ color:C.muted, fontFamily:sans, fontSize:14 }}>{message}</div>
    </div>
  );
}

function Badge({ label, color = C.amber }) {
  return <span style={{ background:`${color}22`, color, padding:'2px 8px', borderRadius:50, fontSize:10, fontWeight:700, fontFamily:sans }}>{label}</span>;
}

// ── STATUS BADGE ──
const statusColors = { New:C.green, Reviewed:'#60A8FF', Quoted:C.amber, Won:C.green, Lost:C.red };

// ══════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return setError('Email and password required');
    setLoading(true); setError('');
    try {
      const data = await auth.login(email, password);
      setToken(data.token);
      onLogin(data.admin);
    } catch (e) {
      setError(e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:sans }}>
      <div style={{ width:380, background:C.surf, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:C.blue, padding:'28px 28px 24px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>☀</div>
          <div style={{ color:C.white, fontWeight:700, fontSize:20 }}>Solarise Insight</div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginTop:4 }}>Admin Portal</div>
        </div>
        {/* Form */}
        <div style={{ padding:28 }}>
          {error && <div style={{ background:'rgba(239,68,68,0.1)', color:C.red, padding:'10px 14px', borderRadius:4, marginBottom:16, fontSize:13, border:`1px solid ${C.red}33` }}>{error}</div>}
          <Input label="EMAIL ADDRESS" value={email} onChange={setEmail} type="email" placeholder="admin@solariseinsight.com" required/>
          <Input label="PASSWORD" value={password} onChange={setPassword} type="password" placeholder="••••••••" required/>
          <Btn onClick={handleLogin} disabled={loading} size="lg" style={{ width:'100%', marginTop:8 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </Btn>
          <p style={{ color:C.muted, fontSize:12, textAlign:'center', marginTop:16 }}>
            Solarise Insight Ltd — Admin Access Only
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════
function Sidebar({ page, setPage, admin, onLogout }) {
  const sections = [
    { group:'OVERVIEW',    items:[{ id:'dashboard', icon:'▣', label:'Dashboard' }] },
    { group:'CONTENT',     items:[{ id:'blog', icon:'📝', label:'Blog & Media' }, { id:'testimonials', icon:'★', label:'Testimonials' }, { id:'partners', icon:'🤝', label:'Brand Partners' }] },
    { group:'OPERATIONS',  items:[{ id:'quotes', icon:'◉', label:'Quote Requests' }, { id:'positions', icon:'🚀', label:'Open Positions' }] },
    { group:'PRODUCTS',    items:[{ id:'products', icon:'☀', label:'Products' }, { id:'gallery', icon:'◫', label:'Gallery' }] },
    { group:'PEOPLE',      items:[{ id:'team', icon:'◌', label:'Team Members' }, ...(admin?.role === 'superadmin' ? [{ id:'users', icon:'👥', label:'User Management' }] : [])] },
    { group:'ACCOUNT',     items:[{ id:'password', icon:'🔑', label:'Change Password' }] },
    { group:'SYSTEM',      items:[{ id:'settings', icon:'⚙', label:'Settings' }] },
  ];

  return (
    <div style={{ width:220, background:C.bg, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', minHeight:'100vh', flexShrink:0 }}>
      {/* Logo */}
      <div style={{ padding:'18px 16px 14px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ color:C.white, fontWeight:700, fontSize:16, fontFamily:sans }}>☀ Solarise</div>
        <div style={{ color:C.muted, fontSize:9, fontWeight:700, letterSpacing:2.5, marginTop:4, fontFamily:sans }}>ADMIN PORTAL</div>
      </div>
      {/* Admin info */}
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ color:C.text, fontSize:13, fontWeight:600, fontFamily:sans }}>{admin?.name}</div>
        <div style={{ color:C.muted, fontSize:11, fontFamily:sans }}>{admin?.role?.toUpperCase()}</div>
      </div>
      {/* Nav */}
      <div style={{ flex:1, padding:'8px 0', overflow:'auto' }}>
        {sections.map(section => (
          <div key={section.group}>
            <div style={{ color:C.muted, fontSize:8, fontWeight:700, letterSpacing:2.5, padding:'10px 14px 4px', fontFamily:sans }}>{section.group}</div>
            {section.items.map(item => (
              <div key={item.id} onClick={() => setPage(item.id)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', cursor:'pointer', fontFamily:sans, fontSize:13, fontWeight:page===item.id?600:400, color:page===item.id?C.amber:C.muted, background:page===item.id?'rgba(245,166,35,0.08)':'transparent', borderLeft:page===item.id?`2px solid ${C.amber}`:'2px solid transparent', transition:'all 0.12s' }}>
                <span style={{ width:16, textAlign:'center' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Logout */}
      <div style={{ padding:'12px 0', borderTop:`1px solid ${C.border}` }}>
        <div onClick={onLogout} style={{ padding:'10px 14px', color:C.muted, cursor:'pointer', fontSize:12, fontFamily:sans, display:'flex', alignItems:'center', gap:8 }}>
          ← Sign Out
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
function Dashboard({ setPage }) {
  const [stats, setStats] = useState({ products:0, quotes:0, team:0, gallery:0 });
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.list(),
      quotesApi.list({ limit:5 }),
      teamApi.list(),
      galleryApi.list(),
    ]).then(([prods, quotesData, tm, gal]) => {
      setStats({ products:prods.length, quotes:quotesData.total||0, team:tm.length, gallery:gal.length });
      setRecentQuotes(quotesData.quotes || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ flex:1, padding:28 }}><Spinner/></div>;

  const statCards = [
    { label:'TOTAL PRODUCTS', value:stats.products, color:C.amber },
    { label:'QUOTE REQUESTS', value:stats.quotes,   color:'#60A8FF' },
    { label:'TEAM MEMBERS',   value:stats.team,     color:'#C090FF' },
    { label:'GALLERY PHOTOS', value:stats.gallery,  color:'#60D8B0' },
  ];

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      <PageHeader title="Dashboard" subtitle="Welcome to Solarise Insight Admin"/>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, background:C.border, marginBottom:20 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background:C.surf, padding:'20px 16px' }}>
            <div style={{ color:C.muted, fontSize:9, fontWeight:700, letterSpacing:2, marginBottom:8, fontFamily:sans }}>{s.label}</div>
            <div style={{ fontFamily:sans, fontSize:32, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Recent quotes */}
      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:6 }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:C.text, fontWeight:700, fontSize:14, fontFamily:sans }}>Recent Quote Requests</span>
          <Btn onClick={() => setPage('quotes')} color="rgba(96,168,255,0.1)" textColor="#60A8FF">View All →</Btn>
        </div>
        {recentQuotes.length === 0
          ? <EmptyState icon="📭" message="No quotes yet"/>
          : recentQuotes.map(q => (
            <div key={q.id} style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}22`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:C.text, fontWeight:600, fontSize:13, fontFamily:sans }}>{q.name}</div>
                <div style={{ color:C.muted, fontSize:11, fontFamily:sans }}>{q.installation_type || 'General'} · {q.location || 'Kenya'}</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ color:C.muted, fontSize:11, fontFamily:sans }}>{new Date(q.created_at).toLocaleDateString('en-KE')}</span>
                <Badge label={q.status} color={statusColors[q.status]||C.amber}/>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════
const CATEGORIES = ['panels','inverters','batteries','loggers','mcb','surge','accessories'];

function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [imgFile, setImgFile] = useState(null);
  const [form, setForm] = useState({ name:'', brand:'', category:'panels', model:'', description:'', price:'', stock:'0', tag:'', image_url:'' });
  const { toast, show, hide } = useToast();

  const load = () => { setLoading(true); productsApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const f = (k) => (v) => setForm(p => ({ ...p, [k]:v }));

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name:item.name, brand:item.brand, category:item.category, model:item.model||'', description:item.description||'', price:item.price, stock:item.stock||0, tag:item.tag||'', image_url:item.image_url||'' });
    setImgFile(null);
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name:'', brand:'', category:'panels', model:'', description:'', price:'', stock:'0', tag:'', image_url:'' });
    setImgFile(null);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.brand || !form.price) return show('Name, brand and price are required', 'error');
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (imgFile) fd.append('image', imgFile);
    try {
      if (editing) await productsApi.update(editing.id, fd);
      else await productsApi.create(fd);
      show(editing ? 'Product updated!' : 'Product added!');
      setShowForm(false);
      load();
    } catch (e) { show(e.message, 'error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await productsApi.delete(id); show('Deleted'); load(); } catch (e) { show(e.message,'error'); }
  };

  const filtered = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Products" subtitle={`${items.length} products`} action={<Btn onClick={openNew} size="md">+ Add Product</Btn>}/>

      <div style={{ marginBottom:12 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." style={{ background:C.surf, border:`1px solid ${C.border}`, color:C.text, padding:'9px 14px', borderRadius:4, fontSize:13, fontFamily:sans, outline:'none', width:280 }}/>
      </div>

      {loading ? <Spinner/> : (
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:6, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Product','Brand','Category','Price','Stock','Actions'].map(h=>(
              <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:C.muted, fontSize:9, fontWeight:700, letterSpacing:1.5, borderBottom:`1px solid ${C.border}`, fontFamily:sans }}>{h}</th>
            ))}</tr></thead>
            <tbody>{filtered.map((p,i)=>(
              <tr key={p.id} style={{ background:i%2===0?C.surf:'rgba(255,255,255,0.02)' }}>
                <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}22` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {p.image_url && <img src={imgSrc(p.image_url)} alt="" style={{ width:36, height:36, objectFit:'cover', borderRadius:4 }} onError={e=>e.target.style.display='none'}/>}
                    <div>
                      <div style={{ color:C.text, fontWeight:600, fontSize:13, fontFamily:sans }}>{p.name}</div>
                      {p.tag && <Badge label={p.tag}/>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:'10px 14px', color:C.amber, fontSize:12, fontWeight:700, fontFamily:sans, borderBottom:`1px solid ${C.border}22` }}>{p.brand}</td>
                <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}22` }}><Badge label={p.category} color="#60A8FF"/></td>
                <td style={{ padding:'10px 14px', color:'#60D8B0', fontWeight:700, fontSize:13, fontFamily:sans, borderBottom:`1px solid ${C.border}22` }}>KES {Number(p.price).toLocaleString()}</td>
                <td style={{ padding:'10px 14px', color:C.muted, fontSize:13, fontFamily:sans, borderBottom:`1px solid ${C.border}22` }}>{p.stock}</td>
                <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}22` }}>
                  <div style={{ display:'flex', gap:5 }}>
                    <Btn onClick={()=>openEdit(p)} color="rgba(96,168,255,0.1)" textColor="#60A8FF">Edit</Btn>
                    <Btn onClick={()=>del(p.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>Del</Btn>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={()=>setShowForm(false)} width={580}>
          <ImageUploadField label="PRODUCT PHOTO" value={form.image_url} onChange={(file)=>setImgFile(file)}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="PRODUCT NAME *" value={form.name} onChange={f('name')} required/>
            <Input label="BRAND *" value={form.brand} onChange={f('brand')} required/>
            <Input label="MODEL / SKU" value={form.model} onChange={f('model')}/>
            <Select label="CATEGORY" value={form.category} onChange={f('category')} options={CATEGORIES}/>
            <Input label="PRICE (KES) *" value={form.price} onChange={f('price')} type="number" required/>
            <Input label="STOCK QTY" value={form.stock} onChange={f('stock')} type="number"/>
            <Select label="TAG" value={form.tag} onChange={f('tag')} options={[{value:'',label:'None'},'Bestseller','Top Pick','New','In-House']}/>
          </div>
          <Input label="DESCRIPTION" value={form.description} onChange={f('description')} rows={3}/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">{editing ? 'Update Product' : 'Save Product'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// QUOTES
// ══════════════════════════════════════════════
function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const { toast, show, hide } = useToast();

  const load = () => {
    setLoading(true);
    quotesApi.list(filter ? { status:filter } : {})
      .then(d => { setQuotes(d.quotes||[]); setTotal(d.total||0); })
      .catch(e=>show(e.message,'error'))
      .finally(()=>setLoading(false));
  };
  useEffect(load, [filter]);

  const updateStatus = async (id, status) => {
    try { await quotesApi.updateStatus(id, status); show('Status updated'); load(); if(selected?.id===id) setSelected(p=>({...p,status})); }
    catch(e) { show(e.message,'error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this quote?')) return;
    try { await quotesApi.delete(id); show('Deleted'); setSelected(null); load(); } catch(e) { show(e.message,'error'); }
  };

  const statuses = ['New','Reviewed','Quoted','Won','Lost'];

  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      {/* List */}
      <div style={{ width:320, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:16, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ color:C.text, fontWeight:700, fontSize:15, fontFamily:sans, marginBottom:10 }}>Quote Requests ({total})</div>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            style={{ width:'100%', background:C.surf, border:`1px solid ${C.border}`, color:C.text, padding:'7px 10px', borderRadius:4, fontSize:12, fontFamily:sans, outline:'none' }}>
            <option value="">All Statuses</option>
            {statuses.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex:1, overflow:'auto' }}>
          {loading ? <Spinner/> : quotes.length === 0 ? <EmptyState icon="📭" message="No quotes found"/> : quotes.map(q=>(
            <div key={q.id} onClick={()=>setSelected(q)}
              style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}22`, cursor:'pointer', background:selected?.id===q.id?'rgba(245,166,35,0.08)':'transparent', borderLeft:selected?.id===q.id?`2px solid ${C.amber}`:'2px solid transparent' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:C.text, fontWeight:600, fontSize:13, fontFamily:sans }}>{q.name}</span>
                <Badge label={q.status} color={statusColors[q.status]||C.amber}/>
              </div>
              <div style={{ color:C.muted, fontSize:11, fontFamily:sans }}>{q.installation_type||'General'} · {new Date(q.created_at).toLocaleDateString('en-KE')}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Detail */}
      {selected ? (
        <div style={{ flex:1, padding:24, overflow:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ color:C.text, fontFamily:sans, fontSize:20, margin:'0 0 4px' }}>{selected.name}</h2>
              <span style={{ color:C.muted, fontFamily:sans, fontSize:12 }}>Ref: {selected.reference}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn onClick={()=>del(selected.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>Delete</Btn>
            </div>
          </div>
          {/* Info */}
          <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:6, padding:16, marginBottom:16 }}>
            {[['Email', selected.email], ['Phone', selected.phone||'—'], ['Type', selected.installation_type||'—'], ['Location', selected.location||'—'], ['Submitted', new Date(selected.created_at).toLocaleString('en-KE')]].map(([k,v])=>(
              <div key={k} style={{ display:'flex', gap:12, marginBottom:8 }}>
                <span style={{ color:C.muted, fontSize:12, fontFamily:sans, width:80, flexShrink:0 }}>{k}</span>
                <span style={{ color:C.text, fontSize:13, fontFamily:sans }}>{v}</span>
              </div>
            ))}
            {selected.message && (
              <div style={{ marginTop:12, padding:12, background:C.bg, borderRadius:4, color:C.text, fontSize:13, fontFamily:sans }}>{selected.message}</div>
            )}
          </div>
          {/* Update Status */}
          <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:6, padding:16, marginBottom:16 }}>
            <div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:1.5, fontFamily:sans, marginBottom:10 }}>UPDATE STATUS</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {statuses.map(s=>(
                <Btn key={s} onClick={()=>updateStatus(selected.id,s)}
                  color={selected.status===s?statusColors[s]||C.amber:'rgba(255,255,255,0.06)'}
                  textColor={selected.status===s?C.dark:C.muted}>
                  {s}
                </Btn>
              ))}
            </div>
          </div>
          {/* Quick Actions */}
          <div style={{ display:'flex', gap:8 }}>
            <a href={`mailto:${selected.email}`} style={{ textDecoration:'none' }}>
              <Btn color="rgba(96,168,255,0.1)" textColor="#60A8FF">📧 Email Client</Btn>
            </a>
            {selected.phone && (
              <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                <Btn color="rgba(34,197,94,0.1)" textColor={C.green}>💬 WhatsApp</Btn>
              </a>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <EmptyState icon="👆" message="Select a quote to view details"/>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// GALLERY
// ══════════════════════════════════════════════
function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [form, setForm] = useState({ title:'', tag:'Residential', year:new Date().getFullYear().toString() });
  const { toast, show, hide } = useToast();

  const load = () => { setLoading(true); galleryApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const save = async () => {
    if (!form.title || !imgFile) return show('Title and image are required', 'error');
    const fd = new FormData();
    fd.append('title', form.title); fd.append('tag', form.tag); fd.append('year', form.year);
    fd.append('image', imgFile);
    try { await galleryApi.upload(fd); show('Photo uploaded!'); setShowForm(false); setImgFile(null); load(); }
    catch(e) { show(e.message,'error'); }
  };

  const feature = async (id) => {
    try { await galleryApi.feature(id); show('Updated'); load(); } catch(e) { show(e.message,'error'); }
  };

  const del = async (id) => {
    if (!confirm('Remove this photo?')) return;
    try { await galleryApi.delete(id); show('Removed'); load(); } catch(e) { show(e.message,'error'); }
  };

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Gallery" subtitle={`${items.length} photos`} action={<Btn onClick={()=>setShowForm(true)} size="md">+ Upload Photo</Btn>}/>
      {loading ? <Spinner/> : items.length === 0 ? <EmptyState icon="🖼️" message="No photos yet"/> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, background:C.border }}>
          {items.map(item=>(
            <div key={item.id} style={{ background:C.surf }}>
              <img src={imgSrc(item.image_url)} alt={item.title} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} onError={e=>e.target.style.display='none'}/>
              <div style={{ padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:C.text, fontSize:12, fontWeight:600, fontFamily:sans }}>{item.title}</div>
                  <Badge label={item.tag} color="#60A8FF"/>
                  {item.featured && <Badge label="Featured" color={C.amber}/>}
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <Btn onClick={()=>feature(item.id)} color={item.featured?'rgba(245,166,35,0.15)':'rgba(255,255,255,0.06)'} textColor={item.featured?C.amber:C.muted}>★</Btn>
                  <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>×</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title="Upload Photo" onClose={()=>setShowForm(false)}>
          <ImageUploadField label="INSTALLATION PHOTO *" onChange={(file)=>setImgFile(file)}/>
          <Input label="TITLE *" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))} placeholder="e.g. Residential Installation — Karen"/>
          <Select label="TAG" value={form.tag} onChange={v=>setForm(p=>({...p,tag:v}))} options={['Residential','Commercial','Off-Grid','Government']}/>
          <Input label="YEAR" value={form.year} onChange={v=>setForm(p=>({...p,year:v}))}/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">Upload Photo</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// BLOG
// ══════════════════════════════════════════════
function Blog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [form, setForm] = useState({ title:'', type:'Article', tag:'', description:'', video_url:'', published:'true' });
  const { toast, show, hide } = useToast();
  const f = k => v => setForm(p=>({...p,[k]:v}));

  const load = () => { setLoading(true); blogApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const openEdit = item => { setEditing(item); setForm({ title:item.title, type:item.type||'Article', tag:item.tag||'', description:item.description||'', video_url:item.video_url||'', published:String(item.published) }); setImgFile(null); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm({ title:'', type:'Article', tag:'', description:'', video_url:'', published:'true' }); setImgFile(null); setShowForm(true); };

  const save = async () => {
    if (!form.title) return show('Title required', 'error');
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (imgFile) fd.append('image', imgFile);
    try {
      if (editing) await blogApi.update(editing.id, fd);
      else await blogApi.create(fd);
      show(editing ? 'Post updated!' : 'Post published!');
      setShowForm(false); load();
    } catch(e) { show(e.message,'error'); }
  };

  const del = async id => { if(!confirm('Delete post?')) return; try { await blogApi.delete(id); show('Deleted'); load(); } catch(e) { show(e.message,'error'); } };

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Blog & Media" subtitle={`${items.length} posts`} action={<Btn onClick={openNew} size="md">+ Add Post</Btn>}/>
      {loading ? <Spinner/> : items.length === 0 ? <EmptyState icon="📝" message="No posts yet"/> : (
        <div style={{ display:'flex', flexDirection:'column', gap:2, background:C.border }}>
          {items.map(item=>(
            <div key={item.id} style={{ background:C.surf, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:C.text, fontWeight:600, fontSize:14, fontFamily:sans, marginBottom:4 }}>{item.title}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <Badge label={item.type||'Article'} color="#C090FF"/>
                  {item.tag && <Badge label={item.tag} color="#60A8FF"/>}
                  <Badge label={item.published?'Published':'Draft'} color={item.published?C.green:C.muted}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <Btn onClick={()=>openEdit(item)} color="rgba(96,168,255,0.1)" textColor="#60A8FF">Edit</Btn>
                <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>Del</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title={editing ? 'Edit Post' : 'Add Post'} onClose={()=>setShowForm(false)} width={560}>
          <ImageUploadField label="THUMBNAIL" value={editing?.image_url} onChange={file=>setImgFile(file)}/>
          <Input label="TITLE *" value={form.title} onChange={f('title')} required/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Select label="TYPE" value={form.type} onChange={f('type')} options={['Article','YouTube Video','Google Drive Video','Training']}/>
            <Input label="TAG" value={form.tag} onChange={f('tag')} placeholder="e.g. Guide, Installation"/>
          </div>
          <Input label="VIDEO URL (YouTube / Google Drive)" value={form.video_url} onChange={f('video_url')} placeholder="https://..."/>
          <Input label="DESCRIPTION" value={form.description} onChange={f('description')} rows={3}/>
          <Select label="STATUS" value={form.published} onChange={f('published')} options={[{value:'true',label:'Published'},{value:'false',label:'Draft'}]}/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">{editing ? 'Update Post' : 'Publish Post'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// TEAM
// ══════════════════════════════════════════════
function Team() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [form, setForm] = useState({ name:'', role:'', bio:'' });
  const { toast, show, hide } = useToast();
  const f = k => v => setForm(p=>({...p,[k]:v}));

  const load = () => { setLoading(true); teamApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const openEdit = item => { setEditing(item); setForm({ name:item.name, role:item.role, bio:item.bio||'' }); setImgFile(null); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm({ name:'', role:'', bio:'' }); setImgFile(null); setShowForm(true); };

  const save = async () => {
    if (!form.name || !form.role) return show('Name and role required', 'error');
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (imgFile) fd.append('image', imgFile);
    try {
      if (editing) await teamApi.update(editing.id, fd);
      else await teamApi.create(fd);
      show(editing ? 'Updated!' : 'Added!');
      setShowForm(false); load();
    } catch(e) { show(e.message,'error'); }
  };

  const del = async id => { if(!confirm('Remove member?')) return; try { await teamApi.delete(id); show('Removed'); load(); } catch(e) { show(e.message,'error'); } };

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Team Members" subtitle={`${items.length} members`} action={<Btn onClick={openNew} size="md">+ Add Member</Btn>}/>
      {loading ? <Spinner/> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, background:C.border }}>
          {items.map(item=>(
            <div key={item.id} style={{ background:C.surf, overflow:'hidden' }}>
              {item.image_url
                ? <img src={imgSrc(item.image_url)} alt={item.name} style={{ width:'100%', height:180, objectFit:'cover', objectPosition:'top' }} onError={e=>e.target.style.display='none'}/>
                : <div style={{ height:180, background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, color:C.border }}>{item.name?.charAt(0)}</div>
              }
              <div style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:C.text, fontWeight:700, fontSize:14, fontFamily:sans }}>{item.name}</div>
                  <div style={{ color:C.muted, fontSize:12, fontFamily:sans }}>{item.role}</div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <Btn onClick={()=>openEdit(item)} color="rgba(96,168,255,0.1)" textColor="#60A8FF">Edit</Btn>
                  <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>×</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title={editing ? 'Edit Member' : 'Add Member'} onClose={()=>setShowForm(false)}>
          <ImageUploadField label="PHOTO" value={editing?.image_url} onChange={file=>setImgFile(file)}/>
          <Input label="FULL NAME *" value={form.name} onChange={f('name')} required/>
          <Input label="ROLE / TITLE *" value={form.role} onChange={f('role')} required/>
          <Input label="BIO (optional)" value={form.bio} onChange={f('bio')} rows={3}/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">{editing ? 'Update' : 'Add Member'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// TESTIMONIALS
// ══════════════════════════════════════════════
function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ client_name:'', location:'', installation_type:'', stars:5, content:'' });
  const { toast, show, hide } = useToast();
  const f = k => v => setForm(p=>({...p,[k]:v}));

  const load = () => { setLoading(true); testimonialsApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const openEdit = item => { setEditing(item); setForm({ client_name:item.client_name, location:item.location||'', installation_type:item.installation_type||'', stars:item.stars||5, content:item.content }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm({ client_name:'', location:'', installation_type:'', stars:5, content:'' }); setShowForm(true); };

  const save = async () => {
    if (!form.client_name || !form.content) return show('Name and review text required', 'error');
    try {
      if (editing) await testimonialsApi.update(editing.id, form);
      else await testimonialsApi.create(form);
      show(editing ? 'Updated!' : 'Added!');
      setShowForm(false); load();
    } catch(e) { show(e.message,'error'); }
  };

  const del = async id => { if(!confirm('Remove review?')) return; try { await testimonialsApi.delete(id); show('Removed'); load(); } catch(e) { show(e.message,'error'); } };

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Testimonials" subtitle={`${items.length} reviews`} action={<Btn onClick={openNew} size="md">+ Add Review</Btn>}/>
      {loading ? <Spinner/> : items.length === 0 ? <EmptyState icon="★" message="No testimonials yet"/> : (
        <div style={{ display:'flex', flexDirection:'column', gap:2, background:C.border }}>
          {items.map(item=>(
            <div key={item.id} style={{ background:C.surf, padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div>
                  <span style={{ color:C.text, fontWeight:700, fontSize:14, fontFamily:sans }}>{item.client_name}</span>
                  <span style={{ color:C.muted, fontSize:12, fontFamily:sans, marginLeft:8 }}>{item.location}</span>
                  <div style={{ display:'flex', gap:1, marginTop:4 }}>{Array(item.stars||5).fill(0).map((_,i)=><span key={i} style={{ color:C.amber }}>★</span>)}</div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <Btn onClick={()=>openEdit(item)} color="rgba(96,168,255,0.1)" textColor="#60A8FF">Edit</Btn>
                  <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>Del</Btn>
                </div>
              </div>
              <div style={{ color:C.muted, fontSize:13, fontFamily:sans, fontStyle:'italic', background:C.bg, padding:'10px 12px', borderLeft:`3px solid ${C.amber}` }}>"{item.content}"</div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title={editing ? 'Edit Review' : 'Add Review'} onClose={()=>setShowForm(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="CLIENT NAME *" value={form.client_name} onChange={f('client_name')} required/>
            <Input label="LOCATION" value={form.location} onChange={f('location')} placeholder="e.g. Karen, Nairobi"/>
            <Input label="INSTALLATION TYPE" value={form.installation_type} onChange={f('installation_type')} placeholder="e.g. Residential 5kW"/>
            <Select label="STAR RATING" value={String(form.stars)} onChange={v=>f('stars')(Number(v))} options={[{value:'5',label:'★★★★★'},{value:'4',label:'★★★★'},{value:'3',label:'★★★'},{value:'2',label:'★★'},{value:'1',label:'★'}]}/>
          </div>
          <Input label="REVIEW TEXT *" value={form.content} onChange={f('content')} rows={4} required/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">{editing ? 'Update Review' : 'Save Review'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// PARTNERS
// ══════════════════════════════════════════════
function Partners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [form, setForm] = useState({ name:'', website:'' });
  const { toast, show, hide } = useToast();

  const load = () => { setLoading(true); partnersApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const save = async () => {
    if (!form.name) return show('Brand name required', 'error');
    const fd = new FormData();
    fd.append('name', form.name); fd.append('website', form.website);
    if (imgFile) fd.append('logo', imgFile);
    try { await partnersApi.create(fd); show('Partner added!'); setShowForm(false); setImgFile(null); load(); }
    catch(e) { show(e.message,'error'); }
  };

  const del = async id => { if(!confirm('Remove partner?')) return; try { await partnersApi.delete(id); show('Removed'); load(); } catch(e) { show(e.message,'error'); } };

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Brand Partners" subtitle={`${items.length} partners`} action={<Btn onClick={()=>setShowForm(true)} size="md">+ Add Partner</Btn>}/>
      {loading ? <Spinner/> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, background:C.border }}>
          {items.map(item=>(
            <div key={item.id} style={{ background:C.surf, padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              {item.logo_url && <img src={imgSrc(item.logo_url)} alt={item.name} style={{ height:40, maxWidth:100, objectFit:'contain', filter:'brightness(0) invert(1)', opacity:0.7 }} onError={e=>e.target.style.display='none'}/>}
              <div style={{ color:C.text, fontSize:13, fontWeight:600, fontFamily:sans }}>{item.name}</div>
              <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>Remove</Btn>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title="Add Brand Partner" onClose={()=>setShowForm(false)}>
          <ImageUploadField label="LOGO" onChange={file=>setImgFile(file)}/>
          <Input label="BRAND NAME *" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} required/>
          <Input label="WEBSITE (optional)" value={form.website} onChange={v=>setForm(p=>({...p,website:v}))} placeholder="https://"/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">Add Partner</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// POSITIONS
// ══════════════════════════════════════════════
function Positions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title:'', type:'Full Time', department:'', description:'', apply_url:'' });
  const { toast, show, hide } = useToast();
  const f = k => v => setForm(p=>({...p,[k]:v}));

  const load = () => { setLoading(true); positionsApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const openEdit = item => { setEditing(item); setForm({ title:item.title, type:item.type||'Full Time', department:item.department||'', description:item.description||'', apply_url:item.apply_url||'' }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm({ title:'', type:'Full Time', department:'', description:'', apply_url:'' }); setShowForm(true); };

  const save = async () => {
    if (!form.title) return show('Title required', 'error');
    try {
      if (editing) await positionsApi.update(editing.id, form);
      else await positionsApi.create(form);
      show(editing ? 'Updated!' : 'Position added!');
      setShowForm(false); load();
    } catch(e) { show(e.message,'error'); }
  };

  const del = async id => { if(!confirm('Remove position?')) return; try { await positionsApi.delete(id); show('Removed'); load(); } catch(e) { show(e.message,'error'); } };

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Open Positions" subtitle={`${items.length} active roles`} action={<Btn onClick={openNew} size="md">+ Add Position</Btn>}/>
      {loading ? <Spinner/> : items.length === 0 ? <EmptyState icon="🚀" message="No open positions"/> : (
        <div style={{ display:'flex', flexDirection:'column', gap:2, background:C.border }}>
          {items.map(item=>(
            <div key={item.id} style={{ background:C.surf, padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:C.text, fontWeight:700, fontSize:15, fontFamily:sans, marginBottom:6 }}>{item.title}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <Badge label={item.type||'Full Time'} color="#60A8FF"/>
                  {item.department && <Badge label={item.department} color={C.amber}/>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <Btn onClick={()=>openEdit(item)} color="rgba(96,168,255,0.1)" textColor="#60A8FF">Edit</Btn>
                <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>Del</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <Modal title={editing ? 'Edit Position' : 'Add Position'} onClose={()=>setShowForm(false)}>
          <Input label="JOB TITLE *" value={form.title} onChange={f('title')} required/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Select label="TYPE" value={form.type} onChange={f('type')} options={['Full Time','Part Time','Internship','Contract']}/>
            <Input label="DEPARTMENT" value={form.department} onChange={f('department')} placeholder="e.g. Engineering"/>
          </div>
          <Input label="DESCRIPTION" value={form.description} onChange={f('description')} rows={3}/>
          <Input label="APPLY URL / FORM LINK" value={form.apply_url} onChange={f('apply_url')} placeholder="https://forms.gle/..."/>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">{editing ? 'Update' : 'Add Position'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════
const ROLES = { superadmin:{ color:C.amber, access:'Full access — all sections' }, marketing:{ color:'#C090FF', access:'Blog, Testimonials, Partners' }, sales:{ color:'#60D8B0', access:'Quotes, Open Positions' }, technical:{ color:'#60A8FF', access:'Products, Gallery' }, hr:{ color:C.red, access:'Team Members, Positions' } };

function Users() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'marketing', department:'' });
  const { toast, show, hide } = useToast();
  const f = k => v => setForm(p=>({...p,[k]:v}));

  const load = () => { setLoading(true); usersApi.list().then(setItems).catch(e=>show(e.message,'error')).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm({ name:'', email:'', password:'', role:'marketing', department:'' }); setAvatarFile(null); setShowForm(true); };

  const save = async () => {
    if (!form.name || !form.email) return show('Name and email required', 'error');
    if (!editing && !form.password) return show('Password required for new accounts', 'error');
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
    if (avatarFile) fd.append('avatar', avatarFile);
    try {
      if (editing) await usersApi.update(editing.id, fd);
      else await usersApi.create(fd);
      show(editing ? 'Account updated!' : 'Account created!');
      setShowForm(false); load();
    } catch(e) { show(e.message,'error'); }
  };

  const suspend = async (id) => {
    try { const r = await usersApi.suspend(id); show(r.message); load(); } catch(e) { show(e.message,'error'); }
  };

  const del = async id => { if(!confirm('Delete this account permanently?')) return; try { await usersApi.delete(id); show('Account deleted'); load(); } catch(e) { show(e.message,'error'); } };

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="User Management" subtitle="Create and manage staff accounts" action={<Btn onClick={openNew} size="md">+ Create Account</Btn>}/>
      {/* Role guide */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:2, background:C.border, marginBottom:20 }}>
        {Object.entries(ROLES).map(([role,info])=>(
          <div key={role} style={{ background:C.surf, padding:'12px 14px' }}>
            <Badge label={role.toUpperCase()} color={info.color}/>
            <div style={{ color:C.muted, fontSize:10, fontFamily:sans, marginTop:6, lineHeight:1.5 }}>{info.access}</div>
          </div>
        ))}
      </div>
      {loading ? <Spinner/> : (
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:6, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['User','Role','Department','Status','Actions'].map(h=>(
              <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:C.muted, fontSize:9, fontWeight:700, letterSpacing:1.5, borderBottom:`1px solid ${C.border}`, fontFamily:sans }}>{h}</th>
            ))}</tr></thead>
            <tbody>{items.map((u,i)=>(
              <tr key={u.id} style={{ background:i%2===0?C.surf:'rgba(255,255,255,0.02)', opacity:u.suspended?0.5:1 }}>
                <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}22` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:C.blue, display:'flex', alignItems:'center', justifyContent:'center', color:C.white, fontWeight:700, fontSize:12, fontFamily:sans, flexShrink:0 }}>
                      {u.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div style={{ color:C.text, fontWeight:600, fontSize:13, fontFamily:sans }}>{u.name}</div>
                      <div style={{ color:C.muted, fontSize:11, fontFamily:sans }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}22` }}><Badge label={u.role?.toUpperCase()} color={ROLES[u.role]?.color||C.muted}/></td>
                <td style={{ padding:'10px 14px', color:C.muted, fontSize:12, fontFamily:sans, borderBottom:`1px solid ${C.border}22` }}>{u.department||'—'}</td>
                <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}22` }}>
                  <span style={{ color:u.suspended?C.red:C.green, fontSize:12, fontFamily:sans, fontWeight:600 }}>● {u.suspended?'Suspended':'Active'}</span>
                </td>
                <td style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}22` }}>
                  {u.role !== 'superadmin' && (
                    <div style={{ display:'flex', gap:5 }}>
                      <Btn onClick={()=>suspend(u.id)} color={u.suspended?'rgba(34,197,94,0.1)':'rgba(245,166,35,0.1)'} textColor={u.suspended?C.green:C.amber}>
                        {u.suspended?'Reinstate':'Suspend'}
                      </Btn>
                      <Btn onClick={()=>del(u.id)} color="rgba(239,68,68,0.1)" textColor={C.red}>Delete</Btn>
                    </div>
                  )}
                  {u.role === 'superadmin' && <span style={{ color:C.muted, fontSize:11, fontFamily:sans }}>Protected</span>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showForm && (
        <Modal title={editing ? 'Edit Account' : 'Create Staff Account'} onClose={()=>setShowForm(false)} width={540}>
          <ImageUploadField label="AVATAR (optional)" onChange={file=>setAvatarFile(file)}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="FULL NAME *" value={form.name} onChange={f('name')} required/>
            <Input label="EMAIL *" value={form.email} onChange={f('email')} type="email" required/>
            <Input label={editing ? 'NEW PASSWORD (leave blank to keep)' : 'PASSWORD *'} value={form.password} onChange={f('password')} type="password"/>
            <Input label="DEPARTMENT" value={form.department} onChange={f('department')} placeholder="e.g. Marketing"/>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:1.5, fontFamily:sans, display:'block', marginBottom:8 }}>ROLE & ACCESS LEVEL</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4 }}>
              {Object.entries(ROLES).map(([role,info])=>(
                <div key={role} onClick={()=>f('role')(role)}
                  style={{ padding:'10px 6px', borderRadius:4, cursor:'pointer', textAlign:'center', border:`1.5px solid ${form.role===role?info.color:C.border}`, background:form.role===role?`${info.color}18`:'transparent' }}>
                  <Badge label={role.toUpperCase()} color={info.color}/>
                  <div style={{ color:C.muted, fontSize:9, fontFamily:sans, marginTop:4, lineHeight:1.3 }}>{info.access.split(',')[0]}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            <Btn onClick={()=>setShowForm(false)} color={C.border} textColor={C.muted}>Cancel</Btn>
            <Btn onClick={save} size="md">{editing ? 'Update Account' : 'Create Account'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// CHANGE PASSWORD
// ══════════════════════════════════════════════
function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, show, hide } = useToast();

  const save = async () => {
    if (!current || !newPw || !confirm) return show('All fields required', 'error');
    if (newPw !== confirm) return show('New passwords do not match', 'error');
    if (newPw.length < 8) return show('Password must be at least 8 characters', 'error');
    setLoading(true);
    try {
      await auth.changePassword(current, newPw);
      show('Password changed successfully!');
      setCurrent(''); setNewPw(''); setConfirm('');
    } catch(e) { show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ flex:1, padding:28, background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Change Password" subtitle="Update your admin account password"/>
      <div style={{ maxWidth:420, background:C.surf, border:`1px solid ${C.border}`, borderRadius:8, padding:24 }}>
        <Input label="CURRENT PASSWORD" value={current} onChange={setCurrent} type="password" placeholder="Your current password"/>
        <Input label="NEW PASSWORD" value={newPw} onChange={setNewPw} type="password" placeholder="At least 8 characters"/>
        <Input label="CONFIRM NEW PASSWORD" value={confirm} onChange={setConfirm} type="password" placeholder="Repeat new password"/>
        {newPw && confirm && newPw !== confirm && (
          <div style={{ color:C.red, fontSize:12, fontFamily:sans, marginBottom:12 }}>⚠ Passwords do not match</div>
        )}
        <Btn onClick={save} disabled={loading} size="md">{loading ? 'Changing...' : 'Change Password'}</Btn>
        <div style={{ color:C.muted, fontSize:12, fontFamily:sans, marginTop:12 }}>
          After changing, you will stay logged in. Your next login will use the new password.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════
function Settings() {
  const [vals, setVals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const { toast, show, hide } = useToast();

  useEffect(() => {
    settingsApi.get().then(setVals).catch(e=>show(e.message,'error')).finally(()=>setLoading(false));
  }, []);

  const fld = (key) => ({ value: vals[key]||'', onChange: v => setVals(p=>({...p,[key]:v})) });

  const saveSection = async (keys) => {
    setSaving(keys[0]);
    const payload = {};
    keys.forEach(k => { payload[k] = vals[k] || ''; });
    try { await settingsApi.update(payload); show('Settings saved!'); }
    catch(e) { show(e.message,'error'); }
    finally { setSaving(''); }
  };

  if (loading) return <div style={{ flex:1, padding:28 }}><Spinner/></div>;

  const Section = ({ title, keys, fields }) => (
    <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:6, padding:20, marginBottom:16 }}>
      <div style={{ color:C.text, fontSize:14, fontWeight:700, fontFamily:sans, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>{title}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        {fields.map(([k,label,placeholder,span])=>(
          <div key={k} style={{ gridColumn:span?'1/-1':undefined }}>
            <Input label={label} placeholder={placeholder} {...fld(k)}/>
          </div>
        ))}
      </div>
      <Btn onClick={()=>saveSection(keys)} disabled={saving===keys[0]} size="md">
        {saving===keys[0] ? 'Saving...' : `Save ${title}`}
      </Btn>
    </div>
  );

  return (
    <div style={{ flex:1, padding:28, overflow:'auto', background:C.bg }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide}/>}
      <PageHeader title="Settings" subtitle="Manage your website configuration"/>
      <Section title="Business Information"
        keys={['company_name','company_phone','company_email','working_hours','company_address']}
        fields={[
          ['company_name',    'COMPANY NAME',    'Solarise Insight Ltd'],
          ['company_phone',   'PHONE',           '(+254) 117951111'],
          ['company_email',   'EMAIL',           'info@solariseinsight.com'],
          ['working_hours',   'WORKING HOURS',   'Mon – Sat, 8am – 6pm'],
          ['company_address', 'ADDRESS',         '209 Mbaruk Rd, Nairobi', true],
        ]}
      />
      <Section title="Social Media Links"
        keys={['facebook_url','instagram_url','youtube_url','whatsapp_number','linkedin_url']}
        fields={[
          ['facebook_url',   'FACEBOOK URL',    'https://facebook.com/...'],
          ['instagram_url',  'INSTAGRAM URL',   'https://instagram.com/...'],
          ['youtube_url',    'YOUTUBE URL',     'https://youtube.com/...'],
          ['whatsapp_number','WHATSAPP NUMBER', '+254117951111'],
          ['linkedin_url',   'LINKEDIN URL',    'https://linkedin.com/...'],
        ]}
      />
      <Section title="Email & Notifications"
        keys={['smtp_host','smtp_port','smtp_user','notify_email']}
        fields={[
          ['smtp_host',    'SMTP HOST',           'mail.solariseinsight.com'],
          ['smtp_port',    'SMTP PORT',           '465'],
          ['smtp_user',    'EMAIL USERNAME',      'info@solariseinsight.com'],
          ['notify_email', 'NOTIFICATION EMAIL',  'info@solariseinsight.com'],
        ]}
      />
      <Section title="Zoho CRM (optional)"
        keys={['zoho_client_id','zoho_client_secret','zoho_refresh_token']}
        fields={[
          ['zoho_client_id',     'CLIENT ID',      ''],
          ['zoho_client_secret', 'CLIENT SECRET',  ''],
          ['zoho_refresh_token', 'REFRESH TOKEN',  '', true],
        ]}
      />
    </div>
  );
}

// ══════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════
export default function App() {
  const [admin, setAdmin] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setChecking(false); return; }
    auth.me()
      .then(data => setAdmin(data))
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (adminData) => setAdmin(adminData);
  const handleLogout = () => { clearToken(); setAdmin(null); setPage('dashboard'); };

  if (checking) {
    return (
      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Spinner/>
      </div>
    );
  }

  if (!admin) return <LoginPage onLogin={handleLogin}/>;

  const pages = {
    dashboard:    <Dashboard setPage={setPage}/>,
    products:     <Products/>,
    quotes:       <Quotes/>,
    gallery:      <Gallery/>,
    blog:         <Blog/>,
    team:         <Team/>,
    testimonials: <Testimonials/>,
    partners:     <Partners/>,
    positions:    <Positions/>,
    users:        <Users/>,
    password:     <ChangePassword/>,
    settings:     <Settings/>,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:sans, background:C.bg }}>
      <Sidebar page={page} setPage={setPage} admin={admin} onLogout={handleLogout}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {pages[page] || <Dashboard setPage={setPage}/>}
      </div>
    </div>
  );
}
