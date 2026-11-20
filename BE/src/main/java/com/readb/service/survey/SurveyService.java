package com.readb.service.survey;

import com.readb.common.exception.BusinessException;
import com.readb.common.exception.ErrorCode;
import com.readb.domain.meeting.Meeting;
import com.readb.domain.meeting.MeetingStatus;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final MeetingRepository meetingRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void submitSurvey(Long memberId, SurveyRequest request) {
        validateMeeting(memberId, request.meetingId());
        if (surveyRepository.existsByMeetingIdAndMemberId(request.meetingId(), memberId)) {
            throw new BusinessException(ErrorCode.SURVEY_ALREADY_SUBMITTED);
        }
        Survey survey = Survey.builder()
                .meetingId(request.meetingId())
                .memberId(memberId)
                .scores(encodeScores(request.scores()))
                .topic(normalizeTopic(request.topic()))
                .build();
        surveyRepository.save(survey);
        if (survey.getTopic() != null) eventPublisher.publishEvent(new SurveyTopicChanged(request.meetingId(), survey.getTopic()));
    }

    @Transactional
    public void updateSurvey(Long memberId, Long meetingId, SurveyRequest request) {
        if (!meetingId.equals(request.meetingId())) throw new BusinessException(ErrorCode.INVALID_INPUT);
        validateMeeting(memberId, meetingId);
        Survey survey = surveyRepository.findForUpdate(meetingId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SURVEY_NOT_FOUND));
        String topic = normalizeTopic(request.topic());
        boolean topicChanged = !java.util.Objects.equals(survey.getTopic(), topic);
        survey.update(encodeScores(request.scores()), topic);
        if (topicChanged && topic != null) eventPublisher.publishEvent(new SurveyTopicChanged(meetingId, topic));
    }

    private void validateMeeting(Long memberId, Long meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEETING_NOT_FOUND));
        if (!meeting.getMemberId().equals(memberId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        if (meeting.getStatus() != MeetingStatus.CREATED) throw new BusinessException(ErrorCode.SURVEY_CLOSED);
    }

    private static String normalizeTopic(String topic) {
        return topic == null || topic.isBlank() ? null : topic.strip();
    }

    // 요청 { q1, q2, q3 } → 저장 { vulnerabilityLevel, dissentLevel, initiativeLevel } (역문항은 6 - 응답으로 변환)
    static Map<String, Object> encodeScores(Map<String, Object> answers) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (SurveyItems.Item item : SurveyItems.ITEMS) {
            if (!(answers.get(item.id()) instanceof Integer value)
                    || value < SurveyItems.MIN_SCALE || value > SurveyItems.MAX_SCALE) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            result.put(item.key(), item.score(value));
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
