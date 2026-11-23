import type { ReactNode } from 'react';

export interface FeedbackCardProps {
  title: string;
  content: ReactNode;
  type?: 'error' | 'warning' | 'info' | 'success';
}

export const feedbackCardStyles = {
  error: {
    card: 'border-red-300',
    title: 'text-red-700',
  },
  warning: {
    card: 'border-yellow-300',
    title: 'text-yellow-700',
  },
  info: {
    card: 'border-blue-300',
    title: 'text-blue-700',
  },
  success: {
    card: 'border-green-300',
    title: 'text-green-700',
  },
} as const;

export function FeedbackCard({ title, content, type = 'info' }: FeedbackCardProps) {
  const styles = feedbackCardStyles[type];

  return (
    <div className={`border-l-2 py-1 pl-3 ${styles.card}`}>
      <h4 className={`mb-1 text-sm font-medium ${styles.title}`}>{title}</h4>
      <div className="whitespace-pre-line text-sm text-gray-600">{content}</div>
    </div>
  );
}

export default FeedbackCard;