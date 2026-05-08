import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import Loader from '../components/Loader'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.center}><Loader /></div>
  if (!data) return null

  const { summary, myTasks, overdueTasks, recentTasks } = data

  const progressPct = summary.totalTasks
    ? Math.round((summary.done / summary.totalTasks) * 100) : 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className={styles.name}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className={styles.date}>{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <StatCard label="Total projects"  value={summary.totalProjects}  sub={`${summary.activeProjects} active`} accent="var(--accent)" delay={0} />
        <StatCard label="Total tasks"     value={summary.totalTasks}     sub={`${summary.done} completed`}        accent="var(--cyan)"   delay={60} />
        <StatCard label="In progress"     value={summary.in_progress}    sub="currently active"                  accent="#f59e0b"       delay={120} />
        <StatCard label="Overdue"         value={summary.overdueCount}   sub="need attention"                    accent="var(--danger)" delay={180} />
      </div>

      {/* Progress bar */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Overall completion</span>
          <span className={styles.progressPct}>{progressPct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={styles.statusRow}>
          {[
            { key: 'todo',        label: 'Todo',        color: '#64748b' },
            { key: 'in_progress', label: 'In progress', color: '#3b82f6' },
            { key: 'review',      label: 'Review',      color: '#f59e0b' },
            { key: 'done',        label: 'Done',        color: '#10b981' },
          ].map(({ key, label, color }) => (
            <div key={key} className={styles.statusItem}>
              <span className={styles.statusDot} style={{ background: color }} />
              <span>{label}</span>
              <strong>{summary[key]}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {/* My tasks */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>My tasks</h2>
            <Link to="/tasks" className={styles.seeAll}>View all →</Link>
          </div>
          {myTasks.length === 0
            ? <div className={styles.empty}>No tasks assigned to you</div>
            : myTasks.map((t, i) => (
              <div key={t._id} className={styles.taskRow} style={{ animationDelay: `${i * 40}ms` }}>
                <div className={styles.taskInfo}>
                  <span className={styles.taskTitle}>{t.title}</span>
                  <span className={styles.taskProject}>{t.project?.name}</span>
                </div>
                <div className={styles.taskMeta}>
                  <Badge color={t.priority}>{t.priority}</Badge>
                  {t.dueDate && (
                    <span className={`${styles.due} ${new Date(t.dueDate) < new Date() ? styles.overdue : ''}`}>
                      {format(new Date(t.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Overdue */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              Overdue
              {overdueTasks.length > 0 && <span className={styles.alertBadge}>{overdueTasks.length}</span>}
            </h2>
          </div>
          {overdueTasks.length === 0
            ? <div className={styles.empty}>Nothing overdue 🎉</div>
            : overdueTasks.map((t, i) => (
              <div key={t._id} className={`${styles.taskRow} ${styles.overdueRow}`} style={{ animationDelay: `${i * 40}ms` }}>
                <div className={styles.taskInfo}>
                  <span className={styles.taskTitle}>{t.title}</span>
                  <span className={styles.taskProject}>{t.project?.name}</span>
                </div>
                <div className={styles.taskMeta}>
                  <span className={styles.overdue}>{format(new Date(t.dueDate), 'MMM d')}</span>
                  {t.assignee && <div className={styles.avatarTiny}>{t.assignee.name[0]}</div>}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}