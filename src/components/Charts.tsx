'use client';

/**
 * Chart wrapper components that use regular recharts imports.
 * These are meant to be dynamically imported via next/dynamic with { ssr: false }
 * to avoid SSR issues with recharts DOM dependencies.
 */
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';

/* ── Admin: 7-day trend area chart ─────── */
export function AdminTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#28A745" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#28A745" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9A800" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#E9A800" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#AAAAAA' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#AAAAAA' }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #E0E0E0' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="confirmed" name="Confirmées" stroke="#28A745" strokeWidth={2} fill="url(#gC)" />
        <Area type="monotone" dataKey="pending" name="En attente" stroke="#E9A800" strokeWidth={2} fill="url(#gP)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Admin: Status pie chart ───────────── */
export function AdminStatusPieChart({ data }: { data: { name: string; value: number; fill: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={(e: any) => `${e.value}`}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Admin: Event type bar chart ──────── */
export function AdminEventTypeChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#AAAAAA' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#AAAAAA' }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4 }} />
        <Bar dataKey="count" name="Réservations" fill="#714B67" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Dashboard: Activity area chart ────── */
export function DashboardTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#714B67" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#714B67" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#AAAAAA' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#AAAAAA' }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #E0E0E0', boxShadow: 'none' }} />
        <Area type="monotone" dataKey="count" name="Réservations" stroke="#714B67" strokeWidth={2} fill="url(#gR)" dot={{ fill: '#714B67', r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Dashboard: Event type bar chart ────── */
const COLORS = ['#714B67','#28A745','#E9A800','#0078BF','#DC3545','#9B7695'];

export function DashboardEventTypeChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#AAAAAA' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#AAAAAA' }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid #E0E0E0' }} />
        <Bar dataKey="count" name="Réservations" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
