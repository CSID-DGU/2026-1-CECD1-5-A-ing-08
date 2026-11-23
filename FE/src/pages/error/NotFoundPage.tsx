import ErrorScreen from './ErrorScreen';

export default function NotFoundPage() {
  return (
    <ErrorScreen
      code="404"
      title="페이지를 찾을 수 없어요"
      description="주소가 잘못됐거나 삭제된 페이지예요. 주소를 다시 확인해 주세요."
    />
  );
}
