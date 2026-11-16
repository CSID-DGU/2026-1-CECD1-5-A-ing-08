package com.readb.service.survey;

import com.readb.repository.MeetingRepository;
import com.readb.service.analysis.AnalysisService;
import com.readb.service.analysis.GeneratedGuideService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class SurveyTopicGenerator {
    private final MeetingRepository meetingRepository;
    private final AnalysisService analysisService;
    private final GeneratedGuideService generatedGuideService;

    @Async("analysisExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void generate(SurveyTopicChanged event) {
        try {
            var meeting = meetingRepository.findById(event.meetingId()).orElse(null);
            if (meeting == null) return;
            var result = analysisService.generateSurveyTopicQuestion(event.topic(), meeting.getMemberId());
            generatedGuideService.saveSurveyTopicIfCurrent(event.meetingId(), event.topic(), result);
        } catch (Exception e) {
            log.warn("Survey topic question generation failed. meetingId={}", event.meetingId(), e);
        }
    }
}
