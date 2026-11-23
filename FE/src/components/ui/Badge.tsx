interface BadgeProps {
  label: string;
  color?: 'red' | 'yellow' | 'orange' | 'green' | 'gray';
}

export default function Badge({ label, color = 'gray' }: BadgeProps) {
  const colors = {
    red: 'bg-risk-soft text-risk',
    yellow: 'bg-caution-soft text-caution',
    orange: 'bg-caution/25 text-caution-strong',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}
