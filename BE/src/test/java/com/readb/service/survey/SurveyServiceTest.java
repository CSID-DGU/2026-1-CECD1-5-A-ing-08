package com.readb.service.survey;

import com.readb.common.exception.BusinessException;
import com.readb.domain.meeting.Meeting;
import com.readb.domain.survey.Survey;
import com.readb.dto.survey.SurveyHistoryResponse;
import com.readb.dto.survey.SurveyRequest;
import com.readb.repository.MeetingRepository;
import com.readb.repository.SurveyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurveyServiceTest {

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private MeetingRepository meetingRepository;

    private SurveyService surveyService;

    @BeforeEach
    void setUp() {
        surveyService = new SurveyService(surveyRepository, meetingRepository);
    }

    @Test
    void getHistoryReturnsSurveysOrderedBySubmittedAt() {
        Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "submittedAt"));
        LocalDateTime t1 = LocalDateTime.now().minusDays(2);
        LocalDateTime t2 = LocalDateTime.now().minusDays(1);
        Survey s1 = Survey.builder().meetingId(10L).memberId(1L).scores(Map.of("energyLevel", 4)).submittedAt(t1).build();
        Survey s2 = Survey.builder().meetingId(20L).memberId(1L).scores(Map.of("energyLevel", 2)).submittedAt(t2).build();

        when(surveyRepository.findByMemberId(1L, pageable)).thenReturn(new PageImpl<>(List.of(s2, s1), pageable, 2));

        Page<SurveyHistoryResponse> result = surveyService.getHistory(1L, pageable);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).meetingId()).isEqualTo(20L);
        assertThat(result.getContent().get(1).meetingId()).isEqualTo(10L);
        assertThat(result.getTotalElements()).isEqualTo(2);
        verify(surveyRepository).findByMemberId(1L, pageable);
    }

    @Test
    void getHistoryReturnsEmptyPageWhenNoSurveys() {
        Pageable pageable = PageRequest.of(0, 20);
        when(surveyRepository.findByMemberId(99L, pageable)).thenReturn(Page.empty(pageable));

        Page<SurveyHistoryResponse> result = surveyService.getHistory(99L, pageable);

        assertThat(result.isEmpty()).isTrue();
    }

    @Test
    void getHistoryMapsScoresCorrectly() {
        Pageable pageable = PageRequest.of(0, 20);
        Map<String, Object> scores = Map.of("energyLevel", 3, "issues", List.of("업무 블로커"));
        Survey survey = Survey.builder().meetingId(5L).memberId(1L).scores(scores).submittedAt(LocalDateTime.now()).build();

        when(surveyRepository.findByMemberId(1L, pageable)).thenReturn(new PageImpl<>(List.of(survey)));

        Page<SurveyHistoryResponse> result = surveyService.getHistory(1L, pageable);

        assertThat(result.getContent().get(0).scores()).isEqualTo(scores);
    }

    @Test
    void submitSurveySavesTrimmedTopicAndBlankAsNull() {
        when(meetingRepository.findById(1L)).thenReturn(Optional.of(Meeting.builder().id(1L).memberId(7L).build()));
        ArgumentCaptor<Survey> captor = ArgumentCaptor.forClass(Survey.class);

        surveyService.submitSurvey(7L, new SurveyRequest(1L, ANSWERS, "  업무량 조정  "));
        surveyService.submitSurvey(7L, new SurveyRequest(1L, ANSWERS, "   "));

        verify(surveyRepository, org.mockito.Mockito.times(2)).save(captor.capture());
        assertThat(captor.getAllValues().get(0).getTopic()).isEqualTo("업무량 조정");
        assertThat(captor.getAllValues().get(1).getTopic()).isNull();
    }

    private static final Map<String, Object> ANSWERS = Map.of("q1", 3, "q2", 3, "q3", 3);

    @Test
    void encodeScoresReversesQ1Q2IntoLevelKeys() {
        Map<String, Object> encoded = SurveyService.encodeScores(Map.of("q1", 1, "q2", 4, "q3", 5));

        // Q1·Q2 역문항: 6 - 응답, Q3 정문항: 그대로
        assertThat(encoded).isEqualTo(Map.of("vulnerabilityLevel", 5, "dissentLevel", 2, "initiativeLevel", 5));
    }

    @Test
    void encodeScoresRejectsMissingOrOutOfRangeAnswers() {
        assertThatThrownBy(() -> SurveyService.encodeScores(Map.of("q1", 3, "q2", 3)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> SurveyService.encodeScores(Map.of("q1", 3, "q2", 3, "q3", 6)))
                .isInstanceOf(BusinessException.class);
    }
}
