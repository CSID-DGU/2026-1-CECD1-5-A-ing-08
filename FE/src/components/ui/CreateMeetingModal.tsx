import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/api/client";
import type { ApiResponse } from "@/api/types";
import MeetingDateTimePicker, { getDefaultDate, getDefaultTime } from "@/components/ui/MeetingDateTimePicker";

interface TeamMemberApi {
  id: number;
  name: string;
  jobTitle: string;
  role: string;
}

const MOCK_MEMBERS: TeamMemberApi[] = [
  { id: 1, name: "김민준", jobTitle: "프로덕트 매니저", role: "member" },
  { id: 2, name: "이서연", jobTitle: "프론트엔드 개발자", role: "member" },
  { id: 3, name: "박지호", jobTitle: "백엔드 개발자", role: "member" },
  { id: 4, name: "최유나", jobTitle: "디자이너", role: "member" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateMeetingModal({ isOpen, onClose, onCreated }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<TeamMemberApi[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TeamMemberApi | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate());
  const [selectedTime, setSelectedTime] = useState<string>(getDefaultTime());
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      setMembers(MOCK_MEMBERS);
      return;
    }
    if (!user?.teamId) return;
    apiClient
      .get<ApiResponse<TeamMemberApi[]>>(`/api/v1/teams/${user.teamId}/members`)
      .then((res) => setMembers(res.data.data))
      .catch(() => setMembers([]));
  }, [isOpen, user?.teamId]);

  const filtered = members.filter(
    (m) => String(m.id) !== user?.id && (m.name?.includes(search) || m.jobTitle?.includes(search))
  );

  const canCreate = selected && !isSubmitting;

  const handleCreate = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setCreateError(null);
    try {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        onCreated();
        navigate(`/leader/meeting/mock-${selected.id}`);
        return;
      }
      const res = await apiClient.post<ApiResponse<{ meetingId: number }>>(
        "/api/v1/meetings",
        {
          teamId: Number(user?.teamId),
          memberId: selected.id,
          title: title.trim(),
          scheduledAt: `${selectedDate}T${selectedTime}:00`,
        }
      );
      onCreated();
      navigate(`/leader/meeting/${res.data.data.meetingId}`);
    } catch {
      setCreateError("미팅 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[720px] max-h-[90vh] overflow-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">1on1 미팅 만들기</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>

        <div className="mb-6">
          <p className="font-semibold mb-2">미팅 제목 <span className="text-sm font-normal text-gray-400">(선택)</span></p>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            placeholder="비워두면 'YYYY년 MM월 DD일 1on1 미팅'으로 저장돼요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* 왼쪽: 멤버 선택 */}
          <div>
            <p className="font-semibold mb-3">미팅 상대는 누구인가요?</p>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:border-brand"
              placeholder="이름이나 이메일 주소를 입력해주세요."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-[180px] overflow-auto mb-6">
              {filtered.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="member"
                    checked={selected?.id === m.id}
                    onChange={() => setSelected(m)}
                    className="accent-brand"
                  />
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                    {m.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.jobTitle}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 오른쪽: 캘린더 */}
          <div>
            <p className="font-semibold mb-3">미팅 날짜를 정해주세요.</p>
            <MeetingDateTimePicker
              date={selectedDate}
              time={selectedTime}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
            />
          </div>
        </div>

        {createError && (
          <p className="text-sm text-red-500 text-right mt-4">{createError}</p>
        )}
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`px-6 py-2.5 rounded-lg text-sm text-white transition-colors ${
              canCreate ? "bg-brand hover:bg-brand-hover" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            미팅 만들기
          </button>
        </div>
      </div>
    </div>
  );
}