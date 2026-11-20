import { useState, useMemo, useEffect, useRef } from "react";

export interface MeetingDateTimePickerProps {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  /** true면 날짜·시간 칸을 한 줄로 두고, 누르면 선택 창이 칸 위에 겹쳐 뜬다 */
  collapsible?: boolean;
}

export const getDefaultDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getDefaultTime = () => {
  const now = new Date();
  const h = now.getHours();
  const min = now.getMinutes();
  if (min < 30) return `${String(h).padStart(2, "0")}:30`;
  const nextH = h + 1;
  if (nextH >= 24) return "23:30";
  return `${String(nextH).padStart(2, "0")}:00`;
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type Menu = "date" | "ampm" | "hour" | "minute" | null;

const fieldCls = "border rounded-lg px-3 py-2 text-sm";
const popoverCls = "absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-2";
const optionCls = (sel: boolean) =>
  `rounded-lg px-2 py-1.5 text-sm ${sel ? "bg-[#5F74FA] text-white" : "hover:bg-gray-100"}`;

export default function MeetingDateTimePicker({ date, time, onDateChange, onTimeChange, collapsible = false }: MeetingDateTimePickerProps) {
  const [menu, setMenu] = useState<Menu>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // 선택된 날짜가 있는 달부터 보여준다
  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m] = date.split("-").map(Number);
    return new Date(y, m - 1);
  });

  // 열린 선택 창은 바깥 클릭·Esc로 닫는다
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const calDays = useMemo(() => {
    const y = viewMonth.getFullYear();
    const mo = viewMonth.getMonth();
    const first = new Date(y, mo, 1).getDay();
    const total = new Date(y, mo + 1, 0).getDate();
    const days: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= total; d++) days.push(d);
    return days;
  }, [viewMonth]);

  const toStr = (d: number) => {
    const y = viewMonth.getFullYear();
    const m = String(viewMonth.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-${String(d).padStart(2, "0")}`;
  };

  const calendar = (
    <div className={collapsible ? "w-[300px] p-2" : "border border-gray-200 rounded-xl p-4"}>
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
          className="text-gray-400 hover:text-gray-600 px-2"
        >
          &lt;
        </button>
        <span className="font-medium text-sm">
          {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
        </span>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
          className="text-gray-400 hover:text-gray-600 px-2"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center text-sm gap-y-2">
        {calDays.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const ds = toStr(day);
          const isSel = date === ds;
          const isSun = i % 7 === 0;
          const isSat = i % 7 === 6;
          return (
            <button
              type="button"
              key={ds}
              aria-pressed={isSel}
              onClick={() => {
                onDateChange(ds);
                setMenu(null);
              }}
              className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center transition-colors
                ${isSel ? "bg-[#5F74FA] text-white" : "hover:bg-gray-100"}
                ${!isSel && isSun ? "text-red-400" : ""}
                ${!isSel && isSat ? "text-blue-400" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!collapsible) {
    return (
      <div>
        {calendar}
        <div className="mt-4">
          <p className="font-semibold mb-2 text-sm">미팅 시간</p>
          <select
            value={time}
            aria-label="미팅 시간"
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4E62E6]"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  const [selY, selM, selD] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(selY, selM - 1, selD).getDay()];
  const [h24, mm] = time.split(":").map(Number);
  const isPm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  // 12시간제 → "HH:mm" (오전 12시 = 00시, 오후 12시 = 12시)
  const setTime = (pm: boolean, hour12: number, minute: number) =>
    onTimeChange(`${pad((hour12 % 12) + (pm ? 12 : 0))}:${pad(minute)}`);
  const toggle = (m: Menu) => setMenu((cur) => (cur === m ? null : m));

  return (
    <div ref={rootRef} className="flex gap-2">
      <div className="relative flex-1">
        <button
          type="button"
          aria-expanded={menu === "date"}
          onClick={() => toggle("date")}
          className={`w-full text-left ${fieldCls} ${menu === "date" ? "border-[#4E62E6]" : "border-gray-200"}`}
        >
          {selY}년 {selM}월 {selD}일 ({weekday})
        </button>
        {menu === "date" && <div className={popoverCls}>{calendar}</div>}
      </div>

      <div className={`flex items-center gap-0.5 ${fieldCls} ${menu && menu !== "date" ? "border-[#4E62E6]" : "border-gray-200"}`}>
        <Segment label="오전/오후" value={isPm ? "오후" : "오전"} open={menu === "ampm"} onToggle={() => toggle("ampm")}
          options={[false, true]} isSelected={(pm) => pm === isPm} render={(pm) => (pm ? "오후" : "오전")}
          onPick={(pm) => { setTime(pm, h12, mm); setMenu(null); }} />
        <Segment label="시" value={String(h12)} open={menu === "hour"} onToggle={() => toggle("hour")}
          options={HOURS_12} isSelected={(h) => h === h12} render={String}
          onPick={(h) => { setTime(isPm, h, mm); setMenu(null); }} />
        <span className="text-gray-400">:</span>
        <Segment label="분" value={pad(mm)} open={menu === "minute"} onToggle={() => toggle("minute")}
          options={MINUTES} isSelected={(m) => m === mm} render={pad}
          onPick={(m) => { setTime(isPm, h12, m); setMenu(null); }} />
      </div>
    </div>
  );
}

// 열릴 때 선택된 항목이 목록 맨 위에 오도록 (목록 자체만 스크롤 — 페이지는 움직이지 않음)
const scrollToSelected = (list: HTMLDivElement | null) => {
  const sel = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
  if (list && sel) list.scrollTop = sel.offsetTop - 8; // 8 = 목록 위쪽 여백(p-2)
};

// 시간 칸의 한 부분(오전/오후·시·분). 선택 목록은 이 부분 바로 아래에 뜬다
function Segment<T>({ label, value, open, onToggle, options, isSelected, render, onPick }: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  options: T[];
  isSelected: (o: T) => boolean;
  render: (o: T) => string;
  onPick: (o: T) => void;
}) {
  return (
    <span className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={onToggle}
        className={`rounded px-1 ${open ? "bg-[#5F74FA]/10 text-[#4E62E6]" : "hover:bg-gray-100"}`}
      >
        {value}
      </button>
      {open && (
        <div ref={scrollToSelected} className={`${popoverCls} flex flex-col w-20 max-h-60 overflow-y-auto`}>
          {options.map((o) => (
            <button
              key={String(o)}
              type="button"
              aria-pressed={isSelected(o)}
              onClick={() => onPick(o)}
              className={optionCls(isSelected(o))}
            >
              {render(o)}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
