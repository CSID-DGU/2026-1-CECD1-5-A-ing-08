import FeedbackCard, { type FeedbackCardProps } from '@/components/feedback/FeedbackCard';

export interface BlockerActionFeedbackItem {
  severity: 'ERROR' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  dataSummary: string;
  actionGuide: string;
}

interface BlockerActionListProps {
  items: BlockerActionFeedbackItem[];
}

const severityToFeedbackType: Record<
  BlockerActionFeedbackItem['severity'],
  NonNullable<FeedbackCardProps['type']>
> = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
};

export const blockerActionFeedbackStyles = {
  actionGuide: 'text-sm font-semibold text-gray-800',
  dataSummary: 'text-xs font-normal text-gray-500',
} as const;

export default function BlockerActionList({ items }: BlockerActionListProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <FeedbackCard
          key={`${item.title}-${index}`}
          title={item.title}
          content={
            <div className="space-y-1">
              <p className={blockerActionFeedbackStyles.actionGuide}>{item.actionGuide}</p>
              <p className={blockerActionFeedbackStyles.dataSummary}>{item.dataSummary}</p>
            </div>
          }
          type={severityToFeedbackType[item.severity]}
        />
      ))}
    </div>
  );
}
