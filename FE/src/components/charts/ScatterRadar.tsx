import { useCallback, useRef, useState } from 'react';
import {
  CartesianGrid,
  Customized,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RadarDataPoint, RadarQuadrant } from '@/types/analysis';

/**
 * quadrant: 기존 사분면 보기 (설문·대화 점수 각각 45 기준 4분할)
 * gap: 대각선 보기 (말한 상태 = 드러난 상태 대각선에서 아래로 벗어난 정도 = Honesty Gap)
 */
export type RadarViewMode = 'quadrant' | 'gap';

export interface ScatterRadarProps {
  data: RadarDataPoint[];
  riskThreshold?: number;
  /** 보기 방식. 기본값은 기존과 같은 'quadrant'. */
  view?: RadarViewMode;
  onMemberClick?: (memberId: number) => void;
}

const DIRECTION_LABELS: Record<RadarDataPoint['direction'], string> = {
  OVERREPORT: '표면 점수 높음',
  UNDERREPORT: '행동 점수 높음',
};

export const QUADRANT_LABELS: Record<RadarQuadrant, string> = {
  STABLE: '안정',
  SILENT_RISK: '주의',
  EXPLICIT_RISK: '위험',
  CONSERVATIVE: '보수적 응답',
};

// 점/배지 색은 위치 사분면(두 점수 모두 반영) 기준으로 통일 — 배경 영역과 항상 일치.
// 베이스라인 40 보정으로 정상 미팅은 저점 구역에서 벗어나므로, 저점에 남는 경우만 실제 위험.
// 좌하단(자기보고·행동 모두 낮음)=위험(red), 우하단(말은 괜찮은데 행동 낮음=숨은 갭)=주의(amber).
const QUADRANT_STYLE: Record<RadarQuadrant, { fill: string; stroke: string; text: string; bg: string }> = {
  STABLE: { fill: 'rgba(32,201,151,0.65)', stroke: '#20C997', text: '#065F46', bg: '#D1FAE5' },
  SILENT_RISK: { fill: 'rgba(245,158,11,0.65)', stroke: '#F59E0B', text: '#92400E', bg: '#FEF3C7' },
  EXPLICIT_RISK: { fill: 'rgba(250,82,82,0.65)', stroke: '#FA5252', text: '#9F1239', bg: '#FED7D7' },
  CONSERVATIVE: { fill: 'rgba(113,133,242,0.45)', stroke: '#7185F2', text: '#7185F2', bg: '#EEF0FD' },
};

// 분기점 45: safety 기준선이 40(발화 없음)이라, 발화가 조금이라도 있으면 상단으로 가도록 BE와 정렬.
const QUADRANT_THRESHOLD = 45;

// 레이더 X 좌표. centered(개인 평균 대비 편차)는 분기선을 개인 평균으로 두고 편차만큼 이동시켜
// raw(0~100)와 같은 축에 함께 그린다 — 평소보다 낮게 응답하면 위험 쪽(왼쪽)으로 이동.
export function getPlotX(point: RadarDataPoint, threshold: number = QUADRANT_THRESHOLD): number {
  if (point.xValue == null) return point.surveyScore;
  if (point.xMode !== 'centered') return point.xValue;
  return Math.max(0, Math.min(100, threshold + point.xValue));
}

export function getQuadrant(point: RadarDataPoint, threshold: number = QUADRANT_THRESHOLD): RadarQuadrant {
  const sHigh = point.safetyScore >= threshold;
  const svHigh = getPlotX(point, threshold) >= threshold;
  if (svHigh && sHigh) return 'STABLE';
  if (svHigh && !sHigh) return 'SILENT_RISK';
  if (!svHigh && !sHigh) return 'EXPLICIT_RISK';
  return 'CONSERVATIVE';
}

// ── 대각선(갭) 보기 ───────────────────────────────────────────────────────────
// BE computeRiskLevel 과 같은 경계: |gap| 25 이상부터 WARNING.
export const GAP_THRESHOLD = 25;

export type GapStatus = 'EXPLICIT_RISK' | 'HIDDEN_GAP' | 'NORMAL';

export const GAP_STATUS_LABELS: Record<GapStatus, string> = {
  EXPLICIT_RISK: '위험',
  HIDDEN_GAP: '조용한 위험',
  NORMAL: '그 외',
};

const GAP_COLORS = {
  risk: '#D64545',
  caution: '#C98A1B',
  neutral: '#9A9EAB',
  ink: '#1A1D29',
  muted: '#9A9EAB',
  line: '#E6E8EE',
  diagonal: '#B9BDC8',
  zone: '#F7F8FA',
  surface: '#FFFFFF',
};

/** 말한 상태(설문) − 드러난 상태(대화). BE honestyGap 과 같은 식이며, 점 위치와 항상 일치하도록 점수에서 계산. */
export function getGap(point: RadarDataPoint): number {
  return point.surveyScore - point.safetyScore;
}

/**
 * 위험: 설문·대화 모두 낮음 (사분면 보기의 위험과 동일 기준, 갭보다 우선).
 * 조용한 위험: 설문은 높게 말했지만 대화 신호가 GAP_THRESHOLD 이상 낮음.
 *
 * 참고: BE riskLevel 은 |gap| 기준이라 대화 신호가 설문보다 크게 높은 경우(음수 갭, 보수적 응답)도
 * WARNING 이 될 수 있지만, 이 보기는 "말보다 행동 신호가 낮은" 숨은 위험만 강조하므로 양수 갭만 본다.
 * 사분면 보기와 기준이 달라 같은 멤버가 두 보기에서 다르게 분류될 수 있다 (예: 90/60 → 안정 / 조용한 위험).
 */
export function getGapStatus(
  point: RadarDataPoint,
  threshold: number = QUADRANT_THRESHOLD,
  gapThreshold: number = GAP_THRESHOLD,
): GapStatus {
  if (point.surveyScore < threshold && point.safetyScore < threshold) return 'EXPLICIT_RISK';
  if (getGap(point) >= gapThreshold) return 'HIDDEN_GAP';
  return 'NORMAL';
}

interface AxisLike {
  scale?: (value: number) => number;
}

interface GapZoneProps {
  xAxisMap?: Record<string, AxisLike>;
  yAxisMap?: Record<string, AxisLike>;
  gapThreshold: number;
}

/** 대각선에서 gapThreshold 이상 아래로 떨어진 삼각형 구역을 옅게 칠함. */
function GapZone({ xAxisMap, yAxisMap, gapThreshold }: GapZoneProps) {
  const xScale = Object.values(xAxisMap ?? {})[0]?.scale;
  const yScale = Object.values(yAxisMap ?? {})[0]?.scale;
  if (!xScale || !yScale) return null;
  const points = [
    [gapThreshold, 0],
    [100, 0],
    [100, 100 - gapThreshold],
  ]
    .map(([x, y]) => `${xScale(x)},${yScale(y)}`)
    .join(' ');
  return (
    <g>
      <polygon points={points} fill={GAP_COLORS.zone} />
      {/* 대각선 라벨: 선 위쪽에 두어 겹치지 않게 함 */}
      <text x={xScale(86)} y={yScale(95)} textAnchor="end" fontSize={11} fill={GAP_COLORS.muted}>
        말 = 행동
      </text>
    </g>
  );
}

interface GapDotProps {
  cx?: number;
  cy?: number;
  payload?: RadarDataPoint;
  threshold: number;
  gapThreshold: number;
  onDotClick: DotClickHandler;
}

/** 위험 = 채운 빨간 점, 조용한 위험 = 빈 주황 고리, 그 외 = 작은 회색 점(이름은 툴팁으로). */
function GapDot({ cx = 0, cy = 0, payload, threshold, gapThreshold, onDotClick }: GapDotProps) {
  if (!payload) return null;
  const status = getGapStatus(payload, threshold, gapThreshold);

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation(); // 바깥 클릭(고정 해제)으로 전파되지 않게
        onDotClick(payload, cx, cy);
      }}
    >
      {status === 'EXPLICIT_RISK' && <circle cx={cx} cy={cy} r={8} fill={GAP_COLORS.risk} />}
      {status === 'HIDDEN_GAP' && (
        <circle cx={cx} cy={cy} r={7} fill={GAP_COLORS.surface} stroke={GAP_COLORS.caution} strokeWidth={2.5} />
      )}
      {status === 'NORMAL' && <circle cx={cx} cy={cy} r={5} fill={GAP_COLORS.neutral} />}
      {status !== 'NORMAL' && (
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize={12} fontWeight={500} fill={GAP_COLORS.ink}>
          {payload.memberName}
        </text>
      )}
    </g>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: RadarDataPoint }[];
  threshold?: number;
  view?: RadarViewMode;
  gapThreshold?: number;
}

const GAP_BADGE_STYLE: Record<GapStatus, { text: string; bg: string }> = {
  EXPLICIT_RISK: { text: '#A33232', bg: '#FBECEC' },
  HIDDEN_GAP: { text: '#8A5D0F', bg: '#FBF3E4' },
  NORMAL: { text: '#6B7080', bg: '#F1F2F5' },
};

function CustomTooltip({ active, payload, threshold, view = 'quadrant', gapThreshold = GAP_THRESHOLD }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  const quadrant = getQuadrant(point, threshold);
  const gapStatus = getGapStatus(point, threshold, gapThreshold);
  const qStyle = view === 'gap' ? GAP_BADGE_STYLE[gapStatus] : QUADRANT_STYLE[quadrant];
  const badgeLabel = view === 'gap' ? GAP_STATUS_LABELS[gapStatus] : QUADRANT_LABELS[quadrant];
  const barWidth = 160;
  const surveyWidth = (point.surveyScore / 100) * barWidth;
  const safetyWidth = (point.safetyScore / 100) * barWidth;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        minWidth: 220,
        fontSize: 12,
      }}
    >
      <p style={{ fontWeight: 700, color: '#111827', marginBottom: 8 }}>{point.memberName}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#6B7280', marginBottom: 8 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>Survey Score</span>
            <strong style={{ color: '#111827' }}>{point.surveyScore}%</strong>
          </div>
          {point.xMode === 'centered' && point.xValue !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span>개인 평균 대비</span>
              <strong style={{ color: '#111827' }}>
                {point.xValue > 0 ? '+' : ''}
                {point.xValue}
              </strong>
            </div>
          )}
          <div style={{ height: 6, width: barWidth, background: '#E5E7EB', borderRadius: 4 }}>
            <div style={{ width: surveyWidth, height: '100%', background: '#5EEAD4', borderRadius: 4 }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>Safety Score</span>
            <strong style={{ color: '#111827' }}>{point.safetyScore}%</strong>
          </div>
          <div style={{ height: 6, width: barWidth, background: '#E5E7EB', borderRadius: 4 }}>
            <div style={{ width: safetyWidth, height: '100%', background: 'rgba(113,133,242,0.55)', borderRadius: 4 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#6B7280' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Honesty Gap</span>
          <strong style={{ color: '#111827' }}>
            {view === 'gap' ? `${getGap(point) > 0 ? '+' : ''}${Math.round(getGap(point))}` : point.honestyGap}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>현재 상태</span>
          <strong style={{ color: '#111827' }}>{DIRECTION_LABELS[point.direction]}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <span
          style={{
            background: qStyle.bg,
            color: qStyle.text,
            borderRadius: 20,
            padding: '2px 10px',
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: RadarDataPoint;
  threshold?: number;
  onDotClick: DotClickHandler;
}

function CustomDot({ cx = 0, cy = 0, payload, threshold, onDotClick }: CustomDotProps) {
  if (!payload) return null;
  const style = QUADRANT_STYLE[getQuadrant(payload, threshold)];

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation(); // 바깥 클릭(고정 해제)으로 전파되지 않게
        onDotClick(payload, cx, cy);
      }}
    >
      <circle cx={cx} cy={cy} r={8} fill={style.fill} stroke={style.stroke} strokeWidth={1.5} />
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fontSize={11}
        fontWeight={500}
        fill={style.text}
      >
        {payload.memberName}
      </text>
    </g>
  );
}

type DotClickHandler = (point: RadarDataPoint, cx: number, cy: number) => void;

interface PinnedTooltip {
  point: RadarDataPoint;
  /** 클릭 순간 호버 툴팁의 transform — 같은 자리에 고정하기 위함 */
  transform: string;
  view: RadarViewMode;
}

/** 멤버 점을 클릭하면 호버 툴팁을 그 자리에 고정. 같은 점 재클릭·빈 곳 클릭 시 해제. */
export default function ScatterRadar({
  data,
  riskThreshold = QUADRANT_THRESHOLD / 100,
  view = 'quadrant',
  onMemberClick,
}: ScatterRadarProps) {
  const threshold = riskThreshold * 100;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState<PinnedTooltip | null>(null);
  // 보기 전환 시 좌표가 달라지므로 같은 보기에서 고정한 것만 유효
  const activePin = pinned?.view === view ? pinned : null;

  const handleDotClick = useCallback<DotClickHandler>(
    (point, cx, cy) => {
      // Recharts 툴팁 래퍼는 차트 좌상단 기준 transform 으로 배치되므로 그대로 복사하면 같은 위치.
      // 호버 툴팁이 없을 때(터치 등)는 점 오른쪽 아래에 둔다.
      const hover = wrapperRef.current?.querySelector<HTMLElement>('.recharts-tooltip-wrapper');
      const transform =
        hover && hover.style.visibility !== 'hidden' && hover.style.transform
          ? hover.style.transform
          : `translate(${cx + 10}px, ${cy + 10}px)`;
      setPinned((prev) =>
        prev?.view === view && prev.point.memberId === point.memberId ? null : { point, transform, view },
      );
      onMemberClick?.(point.memberId);
    },
    [view, onMemberClick],
  );

  return (
    <div ref={wrapperRef} className="relative w-full h-full" onClick={() => setPinned(null)}>
      {view === 'gap' ? (
        <GapRadar
          data={data}
          threshold={threshold}
          gapThreshold={GAP_THRESHOLD}
          hoverDisabled={!!activePin}
          onDotClick={handleDotClick}
        />
      ) : (
        <QuadrantRadar
          data={data}
          threshold={threshold}
          hoverDisabled={!!activePin}
          onDotClick={handleDotClick}
        />
      )}
      {activePin && (
        <div
          className="absolute left-0 top-0 z-10"
          onClick={(e) => e.stopPropagation()}
          style={{ transform: activePin.transform }}
        >
          <CustomTooltip
            active
            payload={[{ payload: activePin.point }]}
            threshold={threshold}
            view={view}
            gapThreshold={GAP_THRESHOLD}
          />
        </div>
      )}
    </div>
  );
}

interface QuadrantRadarProps {
  data: RadarDataPoint[];
  threshold: number;
  hoverDisabled: boolean;
  onDotClick: DotClickHandler;
}

function QuadrantRadar({ data, threshold, hoverDisabled, onDotClick }: QuadrantRadarProps) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" strokeOpacity={0.7} />

          {/* 우상단 안정(green), 우하단 주의(amber), 좌하단 위험(red), 좌상단 보수적(navy) */}
          <ReferenceArea x1={threshold} x2={100} y1={threshold} y2={100} fill="#20C997" fillOpacity={0.2} />
          <ReferenceArea x1={threshold} x2={100} y1={0} y2={threshold} fill="#F59E0B" fillOpacity={0.18} />
          <ReferenceArea x1={0} x2={threshold} y1={0} y2={threshold} fill="#FA5252" fillOpacity={0.2} />
          <ReferenceArea x1={0} x2={threshold} y1={threshold} y2={100} fill="#E0E7FF" fillOpacity={0.32} />

          <XAxis
            type="number"
            dataKey="plotX"
            domain={[0, 100]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            label={{
              value: 'Survey Score',
              position: 'insideBottom',
              offset: -15,
              style: { fontSize: 11, fill: '#9CA3AF' },
            }}
          />
          <YAxis
            type="number"
            dataKey="safetyScore"
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            label={{
              value: 'Safety Score',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 11, fill: '#9CA3AF' },
            }}
          />
          <ReferenceLine x={threshold} stroke="#D1D5DB" strokeDasharray="4 4" strokeWidth={1} />
          <ReferenceLine y={threshold} stroke="#D1D5DB" strokeDasharray="4 4" strokeWidth={1} />

          <Tooltip
            active={hoverDisabled ? false : undefined}
            content={<CustomTooltip threshold={threshold} />}
          />

          <Scatter
            data={data.map((point) => ({ ...point, plotX: getPlotX(point, threshold) }))}
            shape={(props: object) => (
              <CustomDot {...(props as CustomDotProps)} threshold={threshold} onDotClick={onDotClick} />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

interface GapRadarProps {
  data: RadarDataPoint[];
  threshold: number;
  gapThreshold: number;
  hoverDisabled: boolean;
  onDotClick: DotClickHandler;
}

function GapRadar({ data, threshold, gapThreshold, hoverDisabled, onDotClick }: GapRadarProps) {
  const axisTick = { fontSize: 11, fill: GAP_COLORS.muted };
  // 매 렌더마다 새 컴포넌트 타입이 생기지 않도록 고정
  const renderGapZone = useCallback(
    (props: object) => <GapZone {...(props as GapZoneProps)} gapThreshold={gapThreshold} />,
    [gapThreshold],
  );

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <Customized component={renderGapZone} />

          <XAxis
            type="number"
            dataKey="surveyScore"
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={axisTick}
            axisLine={{ stroke: GAP_COLORS.line }}
            tickLine={false}
            label={{
              value: '설문에서 말한 상태 →',
              position: 'insideBottom',
              offset: -15,
              style: { fontSize: 11, fill: GAP_COLORS.muted },
            }}
          />
          <YAxis
            type="number"
            dataKey="safetyScore"
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={axisTick}
            axisLine={{ stroke: GAP_COLORS.line }}
            tickLine={false}
            label={{
              value: '대화에서 드러난 상태 →',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 11, fill: GAP_COLORS.muted, textAnchor: 'middle' },
            }}
          />

          {/* 말 = 행동 기준 대각선 */}
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
            stroke={GAP_COLORS.diagonal}
            strokeWidth={1}
          />
          {/* 조용한 위험 경계: 대각선에서 gapThreshold 만큼 아래 */}
          <ReferenceLine
            segment={[{ x: gapThreshold, y: 0 }, { x: 100, y: 100 - gapThreshold }]}
            stroke={GAP_COLORS.caution}
            strokeOpacity={0.5}
            strokeDasharray="3 4"
            strokeWidth={1}
          />

          <Tooltip
            cursor={false}
            active={hoverDisabled ? false : undefined}
            content={<CustomTooltip threshold={threshold} view="gap" gapThreshold={gapThreshold} />}
          />

          <Scatter
            data={data}
            isAnimationActive={false}
            shape={(props: object) => (
              <GapDot
                {...(props as GapDotProps)}
                threshold={threshold}
                gapThreshold={gapThreshold}
                onDotClick={onDotClick}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
