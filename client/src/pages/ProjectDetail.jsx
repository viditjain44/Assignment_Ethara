import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import TaskCard from '../components/TaskCard'
import Loader from '../components/Loader'
import styles from './ProjectDetail.module.css'

const STATUSES = ['todo', 'in_progress', 'review', 'done']
const STATUS_LABELS = { todo: 'To do', in_progress: 'In progress', review: 'Review', done: 'Done' }
const STATUS_COLORS = { todo: '#475569', in_progress: '#3b82f6', review: '#f59e0b', done: '#10b981' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('board')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedTask, setSelectedTask]   = useState(null)

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' })
  const [memberEmail, setMemberEmail] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = async () => {
    const [pRes, tRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project=${id}`)
    ])
    setProject(pRes.data.project)
    setTasks(tRes.data.tasks)
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const isProjectAdmin =
    user?.role === 'admin' ||
    project?.members?.find(m => m.user._id === user?._id)?.role === 'admin'

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s)
    return acc
  }, {})

  const createTask = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/tasks', { ...taskForm, project: id, assignee: taskForm.assignee || undefined })
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally { setSaving(false) }
  }

  const updateTaskStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}`, { status })
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status } : t))
  }

  const addMember = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail })
      setShowMemberModal(false); setMemberEmail(''); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member')
    } finally { setSaving(false) }
  }

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return
    await api.delete(`/projects/${id}`)
    navigate('/projects')
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'80px' }}><Loader /></div>
  if (!project) return <div>Project not found</div>

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.back} onClick={() => navigate('/projects')}>← Projects</button>
          <div className={styles.projectIcon}>{project.name[0]}</div>
          <div>
            <h1 className={styles.title}>{project.name}</h1>
            {project.description && <p className={styles.desc}>{project.description}</p>}
          </div>
        </div>
        <div className={styles.headerRight}>
          <Badge color={project.status}>{project.status}</Badge>
          {project.deadline && (
            <span className={styles.deadline}>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
          )}
          {isProjectAdmin && (
            <>
              <Button size="sm" onClick={() => setShowMemberModal(true)}>+ Member</Button>
              <Button size="sm" onClick={() => setShowTaskModal(true)}>+ Task</Button>
              <Button size="sm" variant="danger" onClick={deleteProject}>Delete</Button>
            </>
          )}
          {!isProjectAdmin && (
            <Button size="sm" onClick={() => setShowTaskModal(true)}>+ Task</Button>
          )}
        </div>
      </div>

      {/* Members strip */}
      <div className={styles.membersStrip}>
        {project.members.map(m => (
          <div key={m.user._id} className={styles.member} title={`${m.user.name} (${m.role})`}>
            <div className={styles.memberAvatar}>{m.user.name[0]}</div>
            <span className={styles.memberName}>{m.user.name.split(' ')[0]}</span>
            <Badge color={m.role}>{m.role}</Badge>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['board', 'list'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className={styles.taskCount}>{tasks.length} tasks</span>
      </div>

      {/* Board view */}
      {tab === 'board' && (
        <div className={styles.board}>
          {STATUSES.map(status => (
            <div key={status} className={styles.column}>
              <div className={styles.columnHead}>
                <span className={styles.columnDot} style={{ background: STATUS_COLORS[status] }} />
                <span className={styles.columnLabel}>{STATUS_LABELS[status]}</span>
                <span className={styles.columnCount}>{tasksByStatus[status].length}</span>
              </div>
              <div className={styles.columnCards}>
                {tasksByStatus[status].map(task => (
                  <div key={task._id}>
                    <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                    {isProjectAdmin && task.status !== 'done' && (
                      <button className={styles.moveBtn}
                        onClick={() => updateTaskStatus(task._id, STATUSES[STATUSES.indexOf(status) + 1])}>
                        Move to {STATUS_LABELS[STATUSES[STATUSES.indexOf(status) + 1]]} →
                      </button>
                    )}
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className={styles.emptyCol}>No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {tab === 'list' && (
        <div className={styles.list}>
          {tasks.length === 0
            ? <div className={styles.emptyList}>No tasks yet. Create one!</div>
            : tasks.map((t, i) => (
              <div key={t._id} className={styles.listRow} style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => setSelectedTask(t)}>
                <div className={styles.listTitle}>{t.title}</div>
                <div className={styles.listMeta}>
                  <Badge color={t.priority}>{t.priority}</Badge>
                  <Badge color={t.status}>{t.status.replace('_', ' ')}</Badge>
                  {t.assignee && <span className={styles.assigneeName}>{t.assignee.name}</span>}
                  {t.dueDate && <span className={styles.dueDate}>{format(new Date(t.dueDate), 'MMM d')}</span>}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <Modal title={selectedTask.title} onClose={() => setSelectedTask(null)}>
          <div className={styles.taskDetail}>
            <div className={styles.taskBadges}>
              <Badge color={selectedTask.priority}>{selectedTask.priority}</Badge>
              <Badge color={selectedTask.status}>{selectedTask.status.replace('_', ' ')}</Badge>
            </div>
            {selectedTask.description && <p className={styles.taskDesc}>{selectedTask.description}</p>}
            <div className={styles.taskMeta}>
              {selectedTask.assignee && <div><span>Assignee</span><strong>{selectedTask.assignee.name}</strong></div>}
              {selectedTask.dueDate && <div><span>Due date</span><strong>{format(new Date(selectedTask.dueDate), 'MMM d, yyyy')}</strong></div>}
              <div><span>Created by</span><strong>{selectedTask.createdBy?.name}</strong></div>
            </div>
            {isProjectAdmin && (
              <div className={styles.statusButtons}>
                <p className={styles.statusLabel}>Move to:</p>
                <div className={styles.statusBtns}>
                  {STATUSES.filter(s => s !== selectedTask.status).map(s => (
                    <Button key={s} size="sm" variant="secondary"
                      onClick={async () => {
                        await updateTaskStatus(selectedTask._id, s)
                        setSelectedTask({ ...selectedTask, status: s })
                      }}>
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* New task modal */}
      {showTaskModal && (
        <Modal title="New task" onClose={() => setShowTaskModal(false)}>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={createTask} className={styles.form}>
            <div className={styles.field}>
              <label>Title *</label>
              <input name="title" placeholder="Task title" value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </div>
            <div className={styles.field}>
              <label>Description</label>
              <textarea rows={3} placeholder="Details..." value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Due date</label>
                <input type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Assign to</label>
              <select value={taskForm.assignee} onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}>
                <option value="">Unassigned</option>
                {project.members.map(m => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => setShowTaskModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create task</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add member modal */}
      {showMemberModal && (
        <Modal title="Add team member" onClose={() => setShowMemberModal(false)}>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={addMember} className={styles.form}>
            <div className={styles.field}>
              <label>Member email *</label>
              <input type="email" placeholder="teammate@company.com" value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)} required />
            </div>
            <div className={styles.actions}>
              <Button type="button" variant="secondary" onClick={() => setShowMemberModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add member</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}