import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../api/axios'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Loader from '../components/Loader'
import styles from './Projects.module.css'

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const load = () => api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const create = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/projects', form)
      setShowModal(false); setForm({ name: '', description: '', deadline: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally { setSaving(false) }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'80px' }}><Loader /></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.sub}>{projects.length} projects in your workspace</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ New project</Button>
      </div>

      {projects.length === 0
        ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◈</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <Button onClick={() => setShowModal(true)}>Create project</Button>
          </div>
        )
        : (
          <div className={styles.grid}>
            {projects.map((p, i) => {
              const pct = p.taskCount ? Math.round((p.doneCount / p.taskCount) * 100) : 0
              return (
                <div key={p._id} className={styles.card} style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => navigate(`/projects/${p._id}`)}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>{p.name[0].toUpperCase()}</div>
                    <Badge color={p.status}>{p.status}</Badge>
                  </div>
                  <h3 className={styles.cardName}>{p.name}</h3>
                  {p.description && <p className={styles.cardDesc}>{p.description}</p>}
                  <div className={styles.progressRow}>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.progressPct}>{pct}%</span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span className={styles.taskCount}>{p.taskCount} tasks</span>
                    <div className={styles.members}>
                      {p.members.slice(0, 4).map((m) => (
                        <div key={m.user._id} className={styles.memberAvatar} title={m.user.name}>
                          {m.user.name[0]}
                        </div>
                      ))}
                      {p.members.length > 4 && <div className={styles.memberMore}>+{p.members.length - 4}</div>}
                    </div>
                  </div>
                  {p.deadline && (
                    <div className={styles.deadline}>
                      Due {format(new Date(p.deadline), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }

      {showModal && (
        <Modal title="New project" onClose={() => setShowModal(false)}>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={create} className={styles.form}>
            <div className={styles.field}>
              <label>Project name *</label>
              <input name="name" placeholder="e.g. Website Redesign" value={form.name} onChange={handle} required />
            </div>
            <div className={styles.field}>
              <label>Description</label>
              <textarea name="description" placeholder="What is this project about?" value={form.description} onChange={handle} rows={3} />
            </div>
            <div className={styles.field}>
              <label>Deadline</label>
              <input name="deadline" type="date" value={form.deadline} onChange={handle} />
            </div>
            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create project</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}