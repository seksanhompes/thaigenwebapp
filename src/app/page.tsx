'use client'
import { useEffect, useMemo, useRef, useState } from "react";

type Kind = 'text'|'image'|'video';
type Post = {
  id: string;
  kind: Kind;
  title: string;
  url: string;
  mime: string;
  size: number;
  createdAt: string;
  meta?: { mood?: string; caption?: string };
};

const MOODS = [
  { key: 'happy',    label: 'มีความสุข',        emoji: '😊', tone: 'bg-yellow-50' },
  { key: 'calm',     label: 'สงบ/สบายใจ',       emoji: '🕊️', tone: 'bg-blue-50' },
  { key: 'proud',    label: 'ภูมิใจ',            emoji: '✨',  tone: 'bg-purple-50' },
  { key: 'neutral',  label: 'เฉย ๆ',             emoji: '🙂',  tone: 'bg-neutral-50' },
  { key: 'sad',      label: 'เศร้า',             emoji: '😔',  tone: 'bg-slate-50' },
  { key: 'angry',    label: 'โกรธ/หงุดหงิด',     emoji: '😠',  tone: 'bg-rose-50' },
  { key: 'lonely',   label: 'เหงา',              emoji: '🌧️',  tone: 'bg-indigo-50' },
  { key: 'anxious',  label: 'กังวล/เครียด',      emoji: '⚡',  tone: 'bg-amber-50' },
  { key: 'tired',    label: 'เหนื่อยล้า',        emoji: '☕',  tone: 'bg-zinc-50' },
  { key: 'love',     label: 'รู้สึกรัก/ซาบซึ้ง',  emoji: '💗', tone: 'bg-pink-50' },
  { key: 'energy',   label: 'มีพลัง',            emoji: '🌞',  tone: 'bg-lime-50' },
  { key: 'chill',    label: 'ชิลล์',             emoji: '🍃',  tone: 'bg-emerald-50' },
];

export default function App() {
  const [dropdown, setDropdown] = useState(false);
  const [view, setView] = useState<'picker'|'feed'|'search'|'notify'|'profile'|'settings'>('picker');
  const [mood, setMood] = useState<string>('neutral');
  const [intensity, setIntensity] = useState<number>(3);

  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);

  // Compose states
  const [sheet, setSheet] = useState(false);
  const [composeKind, setComposeKind] = useState<Kind>('text');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeCaption, setComposeCaption] = useState('');
  const [composeMood, setComposeMood] = useState('happy');
  const [composeFile, setComposeFile] = useState<File | null>(null);
  const [composeText, setComposeText] = useState('');
  const [busy, setBusy] = useState(false);

  // load persisted
  useEffect(()=>{
    const savedMood = localStorage.getItem('mood');
    const savedInt = localStorage.getItem('intensity');
    if (savedMood) { setMood(savedMood); setView('feed'); }
    if (savedInt) setIntensity(Number(savedInt));
  },[]);

  useEffect(()=>{
    if (view==='feed') loadPosts();
  }, [view, mood, query]);

  async function loadPosts() {
    const params = new URLSearchParams();
    if (mood) params.set('mood', mood);
    if (query) params.set('q', query);
    const res = await fetch(`/api/posts?${params.toString()}`);
    const j = await res.json();
    if (j.ok) setPosts(j.items);
  }

  function enterFeed(m: string) {
    setMood(m);
    localStorage.setItem('mood', m);
    localStorage.setItem('intensity', String(intensity));
    setView('feed');
  }

  async function onPost() {
    if (!composeTitle.trim()) { alert('กรอกหัวข้อ'); return; }
    if (composeKind==='text' && !composeText.trim()) { alert('พิมพ์ข้อความ'); return; }
    if ((composeKind==='image' || composeKind==='video') && !composeFile) { alert('เลือกไฟล์'); return; }
    const fd = new FormData();
    fd.append('kind', composeKind);
    fd.append('title', composeTitle);
    fd.append('caption', composeCaption);
    fd.append('mood', composeMood);
    if (composeKind==='text') fd.append('text', composeText);
    if ((composeKind==='image' || composeKind==='video') && composeFile) fd.append('file', composeFile);
    setBusy(true);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await res.json();
    setBusy(false);
    if (j.ok) {
      setSheet(false);
      setComposeTitle(''); setComposeCaption(''); setComposeText(''); setComposeFile(null);
      loadPosts();
      setView('feed');
    } else {
      alert(j.error || 'Upload failed');
    }
  }

  // UI bits
  const fmt = useMemo(()=> new Intl.DateTimeFormat('th-TH-u-ca-gregory', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false, timeZone:'Asia/Bangkok' }), []);

  return (
    <div className="min-h-[100svh]">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="container px-3 py-2 grid grid-cols-3 items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-neutral-200">
              <img src="https://picsum.photos/seed/profile/80/80" alt="logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-base font-semibold tracking-wide">Thaigen</span>
          </div>
          <div className="flex justify-center">
            {view==='feed' ? (
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหา..." className="w-full max-w-xs rounded-full border border-neutral-200 px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-300" />
            ) : null}
          </div>
          <div className="flex justify-end">
            <button onClick={()=>setDropdown(x=>!x)} aria-label="menu" className="rounded-xl border p-2 hover:bg-neutral-50">
              <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path dName="M4 6h16M4 12h16M4 18h16" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
        {dropdown ? (
          <div className="container px-3 pb-3">
            <div className="rounded-2xl border bg-white shadow-soft p-3 grid sm:grid-cols-2 gap-2 text-sm">
              <button onClick={()=>{ setDropdown(false); setView('picker'); }} className="btn text-left">เปลี่ยนอารมณ์</button>
              <button onClick={()=>{ setDropdown(false); setView('settings'); }} className="btn text-left">ตั้งค่า (เดโม่)</button>
              <button className="btn text-left" onClick={()=>{ /* theme toggle placeholder */ }}>สลับธีม</button>
              <button className="btn text-left" onClick={()=>{ /* logout placeholder */ }}>ออกจากระบบ</button>
            </div>
          </div>
        ) : null}
      </header>

      {/* Mood Picker */}
      {view==='picker' ? (
        <section className="container px-4 py-6">
          <h1 className="text-2xl font-semibold mb-2">วันนี้คุณรู้สึกแบบไหน?</h1>
          <p className="text-neutral-600 mb-4">เลือกอารมณ์หลักสัก 1 อย่างก่อน แล้วระบบจะจัดฟีดที่เหมาะสมให้อัตโนมัติ</p>
          <div className="mb-4 flex items-center gap-3">
            <div className="text-sm text-neutral-700">ความเข้มข้นของอารมณ์: <b>{intensity}</b>/5</div>
            <input type="range" min={1} max={5} value={intensity} onChange={e=>setIntensity(Number(e.target.value))} className="flex-1 accent-neutral-900" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {MOODS.map(m => (
              <button key={m.key} onClick={()=>enterFeed(m.key)} className={`w-full text-left border rounded-2xl p-4 ${m.tone} hover:bg-white transition shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl shrink-0">{m.emoji}</div>
                  <div>
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs text-neutral-500">เลือก</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Feed */}
      {view==='feed' ? (
        <section className="container px-3 py-4 pb-28">
          <div className="text-sm text-neutral-600 mb-4">อารมณ์: {MOODS.find(x=>x.key===mood)?.label || mood} · ระดับ {intensity}/5</div>
          <main className="space-y-4">
            {posts.map(p => (
              <article key={p.id} className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
                <header className="flex items-center gap-3 mb-3">
                  <img className="w-10 h-10 rounded-full object-cover" src="https://picsum.photos/seed/me/96/96" alt="" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.meta?.caption ? p.meta.caption.slice(0,40) : p.title}</div>
                    <time className="text-xs text-neutral-500">{fmt.format(new Date(p.createdAt))}</time>
                  </div>
                </header>
                <p className="whitespace-pre-wrap leading-relaxed mb-3">{p.meta?.caption || ''}</p>
                <div className="mb-3">
                  {p.kind==='image' ? (
                    <img src={p.url} className="w-full rounded-xl border object-cover" loading="lazy" />
                  ) : p.kind==='video' ? (
                    <video src={p.url} controls className="w-full rounded-xl border" playsInline />
                  ) : p.kind==='text' ? (
                    <a className="underline text-blue-600" href={p.url} target="_blank">เปิดข้อความ</a>
                  ) : null}
                </div>
                <footer className="mt-1 pt-3 border-t text-sm text-neutral-700">
                  <div className="flex items-center gap-4">
                    <button className="hover:text-black flex items-center gap-1"><span>😊</span><span className="text-xs text-neutral-600"></span></button>
                    <button className="hover:text-black flex items-center gap-1"><span>💬</span></button>
                    <button className="hover:text-black flex items-center gap-1"><span>↗</span></button>
                  </div>
                </footer>
              </article>
            ))}
          </main>
        </section>
      ) : null}

      {/* Search */}
      {view==='search' ? (
        <section className="container px-3 py-4 pb-28">
          <div className="mb-3">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาคีย์เวิร์ด โพสต์ หรือผู้เขียน..." className="input" />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[{key:'all',label:'ทั้งหมด'}, ...MOODS].map(m => (
              <button key={m.key} onClick={()=>{
                if (m.key==='all') { setQuery(''); setView('feed'); } else { setMood(m.key); setView('feed'); }
              }} className="rounded-full border px-3 py-1 text-sm hover:bg-neutral-50">{(m as any).label || 'ทั้งหมด'}</button>
            ))}
          </div>
          <main className="space-y-4">
            {posts.map(p => (
              <article key={p.id} className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
                <div className="font-medium mb-2">{p.title}</div>
                <div className="text-sm text-neutral-500 mb-2">{p.meta?.caption}</div>
                {p.kind==='image' ? <img src={p.url} className="rounded-xl border" /> : p.kind==='video' ? <video src={p.url} className="rounded-xl border" controls /> : <a className="underline text-blue-600" href={p.url} target="_blank">เปิดข้อความ</a>}
              </article>
            ))}
          </main>
        </section>
      ) : null}

      {/* Notifications (demo) */}
      {view==='notify' ? (
        <section className="container px-3 py-4 pb-28">
          <h2 className="text-xl font-semibold mb-3">การแจ้งเตือน</h2>
          <ul className="space-y-2">
            {Array.from({length: 8}, (_,i)=> (
              <li key={i} className="rounded-xl border bg-white p-3 flex items-center justify-between">
                <div className="text-sm">⭐ ผู้ใช้หมายเลข #{i+1} โต้ตอบโพสต์ของคุณ</div>
                <time className="text-xs text-neutral-500">{fmt.format(new Date(Date.now()-i*3600*1000))}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Profile (demo stats from current posts) */}
      {view==='profile' ? (
        <section className="container px-3 py-4 pb-28">
          <div className="flex items-center gap-4 mb-4">
            <img className="w-16 h-16 rounded-full object-cover border" src="https://picsum.photos/seed/me/128/128" alt="me" />
            <div>
              <div className="text-lg font-semibold">คุณทดลอง</div>
              <div className="text-sm text-neutral-600">“บันทึกใจรายวันด้วย Thaigen”</div>
            </div>
            <button className="ml-auto btn text-sm">แก้ไขโปรไฟล์ (เดโม่)</button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-5">
            <div className="rounded-xl border p-3"><div className="text-xl font-semibold">{posts.length}</div><div className="text-xs text-neutral-600">โพสต์</div></div>
            <div className="rounded-xl border p-3"><div className="text-xl font-semibold">{posts.filter(p=>p.kind==='image').length}</div><div className="text-xs text-neutral-600">รูปภาพ</div></div>
            <div className="rounded-xl border p-3"><div className="text-xl font-semibold">{posts.filter(p=>p.kind==='video').length}</div><div className="text-xs text-neutral-600">วิดีโอ</div></div>
          </div>
          <h3 className="font-medium mb-2">รูปภาพล่าสุด</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {posts.filter(p=>p.kind==='image').slice(0,15).map(p=> (
              <img key={p.id} src={p.url} className="w-full aspect-square object-cover rounded-lg border" />
            ))}
          </div>
        </section>
      ) : null}

      {/* Settings */}
      {view==='settings' ? (
        <section className="container px-3 py-4 pb-28">
          <h2 className="text-xl font-semibold mb-3">ตั้งค่า (เดโม่)</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-black" defaultChecked disabled/> เปิดการแจ้งเตือน</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-black" disabled/> โหมดมืด (เร็ว ๆ นี้)</label>
          </div>
        </section>
      ) : null}

      {/* Bottom Toolbar */}
      {view!=='picker' ? (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 toolbar-safe">
          <div className="relative container h-full">
            <div className="grid grid-cols-5 items-center h-full text-neutral-900">
              <button onClick={()=>setView('feed')} className="h-full flex items-center justify-center hover:bg-neutral-50" title="หน้าแรก" aria-label="หน้าแรก">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l9-8 9 8"></path><path d="M9 22V12h6v10"></path>
                </svg>
              </button>
              <button onClick={()=>setView('search')} className="h-full flex items-center justify-center hover:bg-neutral-50" title="ค้นหา" aria-label="ค้นหา">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle><path d="M21 21l-3.5-3.5"></path>
                </svg>
              </button>
              <div></div>
              <button onClick={()=>setView('notify')} className="h-full flex items-center justify-center hover:bg-neutral-50" title="การแจ้งเตือน" aria-label="การแจ้งเตือน">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path><path d="M13.73 21a2 2 0 01-3.46 0"></path>
                </svg>
              </button>
              <button onClick={()=>setView('profile')} className="h-full flex items-center justify-center hover:bg-neutral-50" title="โปรไฟล์" aria-label="โปรไฟล์">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>
            </div>
            <button onClick={()=>setSheet(true)} className="absolute left-1/2 -translate-x-1/2 -top-8 rounded-full w-16 h-16 bg-black text-white grid place-items-center shadow-soft hover:opacity-90" title="เขียนโพสต์" aria-label="เขียนโพสต์">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </button>
          </div>
        </nav>
      ) : null}

      {/* Compose Sheet */}
      {sheet ? (
        <div onClick={(e)=>{ if (e.currentTarget === e.target) setSheet(false); }} className="fixed inset-0 bg-black/40 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 container shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-semibold">เขียนโพสต์</div>
              <button onClick={()=>setSheet(false)} className="btn">ปิด</button>
            </div>
            <div className="grid gap-3">
              <div className="tabs">
                {(['text','image','video'] as Kind[]).map(k => (
                  <button key={k} onClick={()=>setComposeKind(k)} className={`tab ${composeKind===k?'active':''}`}>{k}</button>
                ))}
              </div>
              <input value={composeTitle} onChange={e=>setComposeTitle(e.target.value)} placeholder="หัวข้อ" className="input" />
              {composeKind==='text' ? (
                <textarea value={composeText} onChange={e=>setComposeText(e.target.value)} rows={3} className="input" placeholder="วันนี้อยากเล่าอะไร..."></textarea>
              ) : (
                <input type="file" onChange={e=>setComposeFile(e.target.files?.[0] || null)} accept={composeKind==='image'?'image/*':'video/*'} className="input" />
              )}
              <input value={composeCaption} onChange={e=>setComposeCaption(e.target.value)} placeholder="คำบรรยาย (ไม่บังคับ)" className="input" />
              <select value={composeMood} onChange={e=>setComposeMood(e.target.value)} className="input">
                {MOODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button disabled={busy} onClick={onPost} className="rounded-xl bg-black text-white px-4 py-2 hover:opacity-90">{busy?'กำลังโพสต์...':'โพสต์'}</button>
                <div className="text-xs text-neutral-500">* โพสต์ถูกบันทึกลงฐานข้อมูล + ไฟล์ถูกเก็บตามตัวเลือกสตอเรจ</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
