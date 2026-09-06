interface BadgeProps {
  color?: string
  children: React.ReactNode
}

export default function Badge({ color = 'gray', children }: BadgeProps) {
  return <span className={`badge badge-${color}`}>{children}</span>
}
