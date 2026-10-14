package com.readb.service.analysis;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.readb.domain.analysis.MeetingPostCoaching;
import com.readb.domain.analysis.MeetingPreBriefing;
import com.readb.domain.analysis.PreBriefingType;
import com.readb.dto.analysis.AnalysisResultResponse;
import com.readb.dto.meeting.PreBriefingResponse;
import com.readb.repository.MeetingPostCoachingRepository;
import com.readb.repository.MeetingPreBriefingRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Map;
import java.util.function.Supplier;

@Service
public class GeneratedGuideService {
    private static final int SCHEMA_VERSION = 1;
    private final MeetingPreBriefingRepository preBriefingRepository;
    private final MeetingPostCoachingRepository postCoachingRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public GeneratedGuideService(MeetingPreBriefingRepository preBriefingRepository,
                                 MeetingPostCoachingRepository postCoachingRepository,
                                 ObjectMapper objectMapper,
                                 PlatformTransactionManager transactionManager) {
        this.preBriefingRepository = preBriefingRepository;
        this.postCoachingRepository = postCoachingRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public <T> T getOrGeneratePre(Long meetingId, PreBriefingType type, Class<T> resultType,
                                  Supplier<T> generator) {
        var existing = preBriefingRepository.findByMeetingIdAndType(meetingId, type);
        if (existing.isPresent()) return decode(existing.get().getSchemaVersion(), existing.get().getPayload(), resultType);

        T generated = generator.get();
        if (!isValid(generated)) return null;
        Map<String, Object> payload = objectMapper.convertValue(generated, new TypeReference<>() {});
        MeetingPreBriefing entity = MeetingPreBriefing.builder()
                .meetingId(meetingId).type(type).schemaVersion(SCHEMA_VERSION).payload(payload).build();
        try {
            transactionTemplate.executeWithoutResult(status -> preBriefingRepository.saveAndFlush(entity));
            return generated;
        } catch (DataIntegrityViolationException collision) {
            return preBriefingRepository.findByMeetingIdAndType(meetingId, type)
                    .map(stored -> decode(stored.getSchemaVersion(), stored.getPayload(), resultType))
                    .orElseThrow(() -> collision);
        }
    }

    public <T> T getOrGeneratePost(Long meetingId, Class<T> resultType, Supplier<T> generator) {
        var existing = postCoachingRepository.findByMeetingId(meetingId);
        if (existing.isPresent()) return decode(existing.get().getSchemaVersion(), existing.get().getPayload(), resultType);

        T generated = generator.get();
        if (!isValid(generated)) return null;
        Map<String, Object> payload = objectMapper.convertValue(generated, new TypeReference<>() {});
        MeetingPostCoaching entity = MeetingPostCoaching.builder()
                .meetingId(meetingId).schemaVersion(SCHEMA_VERSION).payload(payload).build();
        try {
            transactionTemplate.executeWithoutResult(status -> postCoachingRepository.saveAndFlush(entity));
            return generated;
        } catch (DataIntegrityViolationException collision) {
            return postCoachingRepository.findByMeetingId(meetingId)
                    .map(stored -> decode(stored.getSchemaVersion(), stored.getPayload(), resultType))
                    .orElseThrow(() -> collision);
        }
    }

    public void deletePost(Long meetingId) {
        postCoachingRepository.deleteByMeetingId(meetingId);
    }

    private boolean isValid(Object result) {
        if (result instanceof PreBriefingResponse.CoachingGuide guide) {
            return hasText(guide.focusArea()) && hasText(guide.guideSummary())
                    && guide.suggestedQuestions() != null && guide.suggestedQuestions().size() == 2
                    && guide.suggestedQuestions().stream().allMatch(this::hasText)
                    && !guide.suggestedQuestions().get(0).trim()
                            .equals(guide.suggestedQuestions().get(1).trim());
        }
        if (result instanceof PreBriefingResponse.SurveyTopicQuestion question) {
            return question.questions() != null && !question.questions().isEmpty()
                    && question.questions().stream().allMatch(item ->
                            hasText(item.topic()) && hasText(item.question()));
        }
        if (result instanceof AnalysisResultResponse.MeetingCoaching guide) {
            return guide.gapSummary() != null && guide.behaviorAnalysis() != null
                    && guide.nextSteps() != null && !guide.nextSteps().isEmpty()
                    && guide.nextSteps().stream().allMatch(this::hasText);
        }
        return false;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private <T> T decode(int schemaVersion, Map<String, Object> payload, Class<T> resultType) {
        if (schemaVersion != SCHEMA_VERSION) {
            throw new IllegalStateException("Unsupported guide schema version: " + schemaVersion);
        }
        return objectMapper.convertValue(payload, resultType);
    }
}
