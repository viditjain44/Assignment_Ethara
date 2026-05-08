import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import api from '../api/axios'
import Badge from '../components/Badge'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import Button from '../components/Button'
import styles from './Tasks.module.css'

const STATUSES   = ['', 'todo', 'in_progress', 'review', 'done']
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical']

export default function Tasks() {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ status: '', priority: '', overdue: false })
  const [selected, setSelected] = useState(null)

  const load = () => {
    const params = new URLSearchParams()
    if (filters.status)   params.set('status',   filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.overdue)  params.set('overdue',  'true')
    api.get(`/tasks?${params}`).then(r => setTasks(r.data.tasks)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filters])

  const updateStatus = async (id, status) => {
    await api.patch(`/tasks/${id}`, { status })
    setTasks(tasks.map(t => t._id === id ? { ...t, status } : t))
    if (selected?._id === id) setSelected({ ...selected, status })
  }

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${id}`)
    setTasks(tasks.filter(t => t._id !== id))
    setSelected(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.sub}>{tasks.length} tasks found</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className={styles.filterSelect}>
          <option value="">All statuses</option>
          {STATUSES.slice(1).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })} className={styles.filterSelect}>
          <option value="">All priorities</option>
          {PRIORITIES.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <label className={styles.overdueToggle}>
          <input type="checkbox" checked={filters.overdue}
            onChange={e => setFilters({ ...filters, overdue: e.target.checked })} />
          Overdue only
        </label>
        {(filters.status || filters.priority || filters.overdue) && (
          <Button size="sm" variant="ghost"
            onClick={() => setFilters({ status: '', priority: '', overdue: false })}>
            Clear filters
          </Button>
        )}
      </div>

      {loading
        ? <div className={styles.center}><Loader /></div>
        : tasks.length === 0
          ? <div className={styles.empty}>No tasks match your filters</div>
          : (
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Task</span>
                <span>Project</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Assignee</span>
                <span>Due</span>
              </div>
              {tasks.map((t, i) => {
                const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
                return (
                  <div key={t._id} className={`${styles.row} ${overdue ? styles.overdueRow : ''}`}
                    style={{ animationDelay: `${i * 25}ms` }}
                    onClick={() => setSelected(t)}>
                    <span className={styles.taskTitle}>{t.title}</span>
                    <span className={styles.meta}>{t.project?.name}</span>
                    <span><Badge color={t.priority}>{t.priority}</Badge></span>
                    <span><Badge color={t.status}>{t.status.replace('_', ' ')}</Badge></span>
                    <span className={styles.meta}>{t.assignee?.name || '—'}</span>
                    <span className={`${styles.meta} ${overdue ? styles.overdue : ''}`}>
                      {t.dueDate ? format(new Date(t.dueDate), 'MMM d') : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )
      }

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className={styles.detail}>
            <div className={styles.detailBadges}>
              <Badge color={selected.priority}>{selected.priority}</Badge>
              <Badge color={selected.status}>{selected.status.replace('_', ' ')}</Badge>
            </div>
            {selected.description && <p className={styles.detailDesc}>{selected.description}</p>}
            <div className={styles.detailMeta}>
              <div><span>Project</span><strong>{selected.project?.name}</strong></div>
              {selected.assignee && <div><span>Assignee</span><strong>{selected.assignee.name}</strong></div>}
              {selected.dueDate && <div><span>Due</span><strong>{format(new Date(selected.dueDate), 'MMM d, yyyy')}</strong></div>}
            </div>
            <div className={styles.detailActions}>
              <div>
                <p className={styles.statusLabel}>Change status:</p>
                <div className={styles.statusBtns}>
                  {['todo','in_progress','review','done'].filter(s => s !== selected.status).map(s => (
                    <Button key={s} size="sm" variant="secondary" onClick={() => updateStatus(selected._id, s)}>
                      {s.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => deleteTask(selected._id)}>Delete task</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}