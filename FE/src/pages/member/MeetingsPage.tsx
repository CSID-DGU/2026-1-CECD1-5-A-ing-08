import { ROUTES } from "@/constants/routes";
import LeaderMeetingsPage from "@/pages/leader/MeetingsPage";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MemberMeetingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [surveyMessage, setSurveyMessage] = useState<string | null>(() => {
    const state = location.state as { surveyMessage?: unknown } | null;
    return typeof state?.surveyMessage === 'string' ? state.surveyMessage : null;
  });

  useEffect(() => {
    if (surveyMessage) navigate(location.pathname, { replace: true, state: null });
  }, [surveyMessage, location.pathname, navigate]);

  useEffect(() => {
    if (!surveyMessage) return;
    const timeout = window.setTimeout(() => setSurveyMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [surveyMessage]);

  return (
    <>
      {surveyMessage && (
        <div role="status" className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-800 shadow-lg">
          {surveyMessage}
        </div>
      )}
      <LeaderMeetingsPage
        showCreateButton={false}
        getMeetingPath={ROUTES.MEMBER_MEETING}
        showTeamPanels={false}
      />
    </>
  );
}
