package com.readb.dto.meeting;

import jakarta.validation.constraints.NotBlank;

public record TranscriptAnalyzeRequest(
        @NotBlank String transcript,
        Integer durationSec
) {}
