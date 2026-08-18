export default function EmptyState({ icon, title, description, children, className = '' }) {
  return (
    <div className={`text-center py-14 animate-fade-in-up ${className}`}>
      {icon && <div className="empty-state-icon mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold text-(--color-text-secondary) mb-2">{title}</h3>
      {description && <p className="text-(--color-text-tertiary) mb-6">{description}</p>}
      {children}
    </div>
  )
}
