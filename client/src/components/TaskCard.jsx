import { format } from 'date-fns'
import Badge from './Badge'
import styles from './TaskCard.module.css'

export default function TaskCard({ task, onClick }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <Badge color={task.priority}>{task.priority}</Badge>
        <Badge color={task.status}>{task.status.replace('_', ' ')}</Badge>
      </div>
      <h3 className={styles.title}>{task.title}</h3>
      {task.description && <p className={styles.desc}>{task.description}</p>}
      <div className={styles.footer}>
        {task.assignee ? (
          <div className={styles.assignee}>
            <div className={styles.avatarSm}>{task.assignee.name[0]}</div>
            <span>{task.assignee.name}</span>
          </div>
        ) : <span className={styles.unassigned}>Unassigned</span>}
        {task.dueDate && (
          <span className={`${styles.due} ${isOverdue ? styles.overdue : ''}`}>
            {isOverdue ? '⚠ ' : ''}
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}