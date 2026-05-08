import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Loader from '../components/Loader'
import styles from './Users.module.css'

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (q = '') => {
    const params = q ? `?search=${encodeURIComponent(q)}` : ''
    api.get(`/users${params}`).then(r => setUsers(r.data.users)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const changeRole = async (id, role) => {
    await api.patch(`/users/${id}/role`, { role })
    setUsers(users.map(u => u._id === id ? { ...u, role } : u))
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    await api.delete(`/users/${id}`)
    setUsers(users.filter(u => u._id !== id))
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.sub}>{users.length} users</p>
        </div>
        <input className={styles.search} placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
      </div>

      {loading
        ? <div className={styles.center}><Loader /></div>
        : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>
            {users.map((u, i) => (
              <div key={u._id} className={styles.row} style={{ animationDelay: `${i * 30}ms` }}>
                <div className={styles.userCell}>
                  <div className={styles.avatar}>{u.name[0]}</div>
                  <div>
                    <div className={styles.userName}>{u.name} {u._id === me._id && <span className={styles.you}>you</span>}</div>
                  </div>
                </div>
                <span className={styles.email}>{u.email}</span>
                <span><Badge color={u.role}>{u.role}</Badge></span>
                <span className={styles.date}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
                <div className={styles.actions}>
                  {u._id !== me._id && (
                    <>
                      <Button size="sm" variant="ghost"
                        onClick={() => changeRole(u._id, u.role === 'admin' ? 'member' : 'admin')}>
                        Make {u.role === 'admin' ? 'member' : 'admin'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => deleteUser(u._id)}>Delete</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}