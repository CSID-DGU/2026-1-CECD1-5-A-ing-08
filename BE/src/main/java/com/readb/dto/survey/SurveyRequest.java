package com.readb.dto.survey;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record SurveyRequest(
        @NotNull Long meetingId,
        @NotNull Map<String, Object> scores,
        @Size(max = 200) String topic
) {}
