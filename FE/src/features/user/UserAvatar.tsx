import Avatar from '@/components/ui/Avatar';
import { useProfileImage } from './useProfileImage';

interface UserAvatarProps {
  userId?: string | number | null;
  name?: string | null;
  className?: string;
}

// userId로 프로필 이미지를 불러와 Avatar에 넘긴다.
export default function UserAvatar({ userId, name, className }: UserAvatarProps) {
  const imageUrl = useProfileImage(userId);
  return <Avatar name={name} imageUrl={imageUrl} className={className} />;
}
