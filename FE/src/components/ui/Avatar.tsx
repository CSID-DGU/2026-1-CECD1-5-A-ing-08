interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  // 크기·배경색·글자 크기 (예: 'w-7 h-7 bg-emerald-500 text-xs')
  className?: string;
}

// 프로필 이미지가 있으면 이미지를, 없으면 이름 첫 글자를 보여준다.
export default function Avatar({ name, imageUrl, className = '' }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name ? `${name} 프로필 이미지` : '프로필 이미지'}
        className={`${className} shrink-0 rounded-full bg-gray-100 object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      aria-hidden
    >
      {name?.trim().charAt(0) ?? ''}
    </div>
  );
}
