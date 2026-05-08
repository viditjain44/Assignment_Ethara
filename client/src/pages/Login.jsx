import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.hero}>
          <div className={styles.heroLogo}>TF</div>
          <h1 className={styles.heroTitle}>Ship projects,<br />not excuses.</h1>
          <p className={styles.heroSub}>Track every task. Align every team.<br />Deliver what matters.</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><span>∞</span>Projects</div>
            <div className={styles.heroStat}><span>↑</span>Real-time</div>
            <div className={styles.heroStat}><span>◈</span>Role-based</div>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <h2 className={styles.title}>Welcome back</h2>
          <p className={styles.subtitle}>Sign in to your workspace</p>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={submit} className={styles.form}>
            <div className={styles.field}>
              <label>Email</label>
              <input name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handle} required />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle} required />
            </div>
            <Button type="submit" size="lg" loading={loading} className={styles.submit}>
              Sign in →
            </Button>
          </form>
          <p className={styles.switch}>
            No account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}