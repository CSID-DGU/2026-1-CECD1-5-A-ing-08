package com.readb.service.survey;

import com.readb.common.exception.BusinessException;
import com.readb.common.exception.ErrorCode;
import com.readb.domain.meeting.Meeting;
import com.readb.domain.survey.Survey;
import com.readb.domain.survey.SurveyItems;
import com.readb.dto.survey.SurveyHistoryResponse;
import com.readb.dto.survey.SurveyRequest;
import com.readb.dto.survey.SurveyResponse;
import com.readb.repository.MeetingRepository;
import com.readb.repository.SurveyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final MeetingRepository meetingRepository;

    @Transactional
    public void submitSurvey(Long memberId, SurveyRequest request) {
        Meeting meeting = meetingRepository.findById(request.meetingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        // 서베이는 미팅의 멤버 본인만 제출 가능 (리더 계정 등 타인 제출 차단)
        if (!meeting.getMemberId().equals(memberId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (surveyRepository.existsByMeetingIdAndMemberId(request.meetingId(), memberId)) {
            throw new BusinessException(ErrorCode.SURVEY_ALREADY_SUBMITTED);
        }
        Survey survey = Survey.builder()
                .meetingId(request.meetingId())
                .memberId(memberId)
                .scores(encodeScores(request.scores()))
                .topic(request.topic() != null && !request.topic().isBlank() ? request.topic().strip() : null)
                .build();
        surveyRepository.save(survey);
    }

    // raw 응답과 문항 버전만 저장 { version: "v2", q1, q2, q3 } — 역문항 변환·합산은 읽을 때 SurveyItems로 계산
    static Map<String, Object> encodeScores(Map<String, Object> answers) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("version", SurveyItems.VERSION);
        for (SurveyItems.Item item : SurveyItems.ITEMS) {
            if (!(answers.get(item.id()) instanceof Integer value)
                    || value < SurveyItems.MIN_SCALE || value > SurveyItems.MAX_SCALE) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            result.put(item.id(), value);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Page<SurveyHistoryResponse> getHistory(Long memberId, Pageable pageable) {
        return surveyRepository.findByMemberId(memberId, pageable)
                .map(s -> new SurveyHistoryResponse(s.getMeetingId(), s.getSubmittedAt(), s.getScores()));
    }

    @Transactional(readOnly = true)
    public SurveyResponse getSurvey(Long meetingId) {
        Survey survey = surveyRepository.findByMeetingId(meetingId).stream()
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.SURVEY_NOT_FOUND));
        return SurveyResponse.from(survey);
    }
}
