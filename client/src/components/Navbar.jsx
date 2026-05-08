import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

const navItems = [
  { to: '/dashboard', icon: '▦',  label: 'Dashboard' },
  { to: '/projects',  icon: '◈',  label: 'Projects'  },
  { to: '/tasks',     icon: '◎',  label: 'Tasks'     },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  return (
    <aside className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>TF</span>
        <span className={styles.logoText}>TaskFlow</span>
      </div>

      <nav className={styles.links}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }>
            <span className={styles.icon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink to="/users" className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }>
            <span className={styles.icon}>◑</span>
            <span>Users</span>
          </NavLink>
        )}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.userCard}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
        </div>
        <button className={styles.logout} onClick={handleLogout} title="Logout">
          ⎋
        </button>
      </div>
    </aside>
  )
}