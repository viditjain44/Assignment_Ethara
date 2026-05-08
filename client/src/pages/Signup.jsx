import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import styles from './Auth.module.css'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'member' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await signup(form.name, form.email, form.password, form.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.hero}>
          <div className={styles.heroLogo}>TF</div>
          <h1 className={styles.heroTitle}>Build together.<br />Ship faster.</h1>
          <p className={styles.heroSub}>One workspace for your entire team.<br />Create, assign, track — done.</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><span>◎</span>Tasks</div>
            <div className={styles.heroStat}><span>◑</span>Teams</div>
            <div className={styles.heroStat}><span>▦</span>Boards</div>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.title}>Create account</h2>
          <p className={styles.subtitle}>Start managing your projects</p>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={submit} className={styles.form}>
            <div className={styles.field}>
              <label>Full name</label>
              <input name="name" placeholder="Alex Johnson" value={form.name} onChange={handle} required />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handle} required />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handle} required />
            </div>
            <div className={styles.field}>
              <label>Role</label>
              <select name="role" value={form.role} onChange={handle}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button type="submit" size="lg" loading={loading} className={styles.submit}>
              Create account →
            </Button>
          </form>
          <p className={styles.switch}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}