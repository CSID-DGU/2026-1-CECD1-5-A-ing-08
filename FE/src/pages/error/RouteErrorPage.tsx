import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import ErrorScreen from './ErrorScreen';
import NotFoundPage from './NotFoundPage';

// 화면을 그리다 예상치 못한 오류가 나면 흰 화면 대신 이 화면을 보여준다.
export default function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  const detail = import.meta.env.DEV
    ? error instanceof Error
      ? `${error.message}\n\n${error.stack ?? ''}`
      : String(error)
    : undefined;

  return (
    <ErrorScreen
      title="문제가 생겼어요"
      description="화면을 불러오는 중 오류가 발생했어요. 새로고침해도 계속되면 팀에 알려 주세요."
      showReload
      detail={detail}
    />
  );
}
