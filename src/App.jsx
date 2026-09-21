import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, Download, Power, RefreshCw, TriangleAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchMachineEvents } from './services/googleSheets';
import { formatDate, formatDuration, instantToInput } from './utils/dateUtils';
import { calculateReport, displayStatus, normalizeEvents } from './utils/machineCalculations';
import { downloadReport } from './utils/reportUtils';
import Footer from './components/Footer';
import './styles.css';

const today = () => instantToInput(new Date());
const daysAgo = n => instantToInput(new Date(Date.now() - n * 86400000));
function rangeShortcut(kind) { const n = new Date(), y = n.getFullYear(), m = n.getMonth(); if (kind === 'today') return [today(),today()]; if (kind === 'yesterday') return [daysAgo(1),daysAgo(1)]; if (kind === 'week') return [daysAgo(6),today()]; if (kind === 'month') return [instantToInput(new Date(y,m,1)),today()]; return [instantToInput(new Date(y,m-1,1)), instantToInput(new Date(y,m,0))]; }

export default function App() {
  const [raw, setRaw] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [now, setNow] = useState(new Date());
  const [from, setFrom] = useState(today), [to, setTo] = useState(today), [draft, setDraft] = useState({ from: today(), to: today() }), [active, setActive] = useState('today');
  const load = useCallback(async () => { try { setError(''); const data = await fetchMachineEvents(); setRaw(normalizeEvents(data)); } catch (e) { setError(e.message || 'Unable to retrieve damper data.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, [load]);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const report = useMemo(() => calculateReport(raw, from, to, now), [raw, from, to, now]);
  const latest = raw.at(-1), isOn = latest?.status === 'ON', currentDuration = isOn ? now - latest.at : 0;
  const apply = () => { if (draft.from > draft.to) return setError('From date must be on or before To date.'); setError(''); setFrom(draft.from); setTo(draft.to); setActive('custom'); };
  const selectQuick = key => { const [a,b] = rangeShortcut(key); setDraft({from:a,to:b}); setFrom(a); setTo(b); setActive(key); setError(''); };
  if (loading) return <main className="loading"><Activity size={30}/><h2>Loading damper data…</h2><p>Connecting to the monitoring log.</p></main>;
  return <div className="shell" style={{ display: 'block' }}><main style={{ width: '100%', marginLeft: 0, marginRight: 'auto' }}>
    <header><div className="company-heading"><img src="/brand/indsil-logo.png" alt="Indsil logo"/><div><p className="eyebrow">OPERATIONS / DAMPER 01</p><h1>INDSIL HYDRO POWER & MANGANESE LTD</h1><p className="muted">Online Emergency Stack Monitoring System</p></div></div><div className="header-actions"><span className="updated">● Updated automatically</span><button className="secondary" onClick={load}><RefreshCw size={16}/> Refresh</button><button className="primary" onClick={() => downloadReport(report)}><Download size={16}/> Print PDF</button></div></header>
    {error && <div className="error"><TriangleAlert size={20}/><div><b>Unable to retrieve damper data.</b><br/>{error} <button onClick={load}>Retry</button></div></div>}
    <section className={'hero ' + (isOn ? 'on' : 'off')}><div><p className="eyebrow">CURRENT DAMPER STATUS</p><h2><span className="status-dot"/> {latest ? `DAMPER ${displayStatus(latest.status).toUpperCase()}` : 'NO DATA'}</h2><p>{latest ? `Last event: ${formatDate(latest.at)}, ${latest.time} IST` : 'No damper events received yet.'}</p></div><div className="hero-time"><span>Current duration</span><strong>{formatDuration(currentDuration)}</strong><small>{isOn ? 'Current open period' : 'Damper is closed'}</small></div></section>
    <section className="filters"><div className="quick">{[['today','Today'],['yesterday','Yesterday'],['week','Last 7 days'],['month','This month'],['last','Last month']].map(([k,l]) => <button key={k} className={active===k?'active':''} onClick={()=>selectQuick(k)}>{l}</button>)}</div><div className="dates"><label>From date<input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></label><label>To date<input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></label><button className="primary" onClick={apply}>Apply filter</button></div></section>
    <section className="cards"><Metric icon={<Clock3/>} label="Cumulative open time" value={formatDuration(report.onTime)} sub={`${formatDate(report.start)} — ${formatDate(report.end)}`}/><Metric icon={<Power/>} label="Open count" value={report.openCount} sub="Close → Open transitions"/></section>
    <Panel title="Day-wise open count" sub="Confirmed Close → Open transitions by day"><DayOpenCountChart data={report.daily}/></Panel>
    <Panel title="Day-wise overview" sub="Runtime, openings and open periods"><div className="summary-list">{report.daily.map(x=><div key={x.date}><b>{x.date}</b><span>{formatDuration(x.openTime)}</span><span>{x.openCount} opens · {x.periods} periods</span></div>)}</div></Panel>
    <Panel title="Month-wise summary" sub="Totals across the selected reporting period"><div className="summary-list">{report.monthly.map(x=><div key={x.month}><b>{x.month}</b><span>{formatDuration(x.openTime)}</span><span>{x.openCount} opens</span></div>)}</div></Panel>
    <Panel title="Event history" sub={`Selected period: ${formatDate(report.start)} — ${formatDate(report.end)}`}><div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Status</th><th>Duration</th><th>Cumulative open time</th><th>Open count</th></tr></thead><tbody>{report.history.length ? [...report.history].reverse().map((x,i)=><tr key={`${x.date}-${x.time}-${i}`}><td>{x.date}</td><td>{x.time}</td><td><span className={'badge '+x.status.toLowerCase()}>{displayStatus(x.status)}</span></td><td>{x.status==='ON'?formatDuration(x.duration):'—'}</td><td>{formatDuration(x.cumulative)}</td><td>{x.status==='ON' ? x.openCount : '—'}</td></tr>) : <tr><td colSpan="6" className="empty">No damper data available for the selected date range.</td></tr>}</tbody></table></div></Panel>
    <Footer />
  </main></div>;
}
function Metric({icon,label,value,sub}) { return <article className="metric"><div className="metric-icon">{icon}</div><p>{label}</p><h3>{value}</h3><small>{sub}</small></article> }
function Panel({title,sub,children}) { return <section className="panel"><div className="panel-title"><div><h2>{title}</h2><p>{sub}</p></div></div>{children}</section> }
function DayOpenCountChart({ data }) {
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height={280}><BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e1e8e4"/><XAxis dataKey="date" tick={{ fill: '#687871', fontSize: 10 }} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tick={{ fill: '#687871', fontSize: 10 }} tickLine={false} axisLine={false}/><Tooltip cursor={{ fill: '#eaf3fb' }} contentStyle={{ border: '1px solid #bdd8f0', borderRadius: 8 }} formatter={value => [value, 'Open count']} labelFormatter={label => `Date: ${label}`}/><Bar dataKey="openCount" name="Open count" fill="#0057a8" radius={[5, 5, 0, 0]} maxBarSize={46}/></BarChart></ResponsiveContainer></div>;
}
