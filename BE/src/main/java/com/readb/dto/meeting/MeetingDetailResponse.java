package com.readb.dto.meeting;

import java.time.LocalDateTime;

public record MeetingDetailResponse(
        Long meetingId,
        Long memberId,
        int round,
        String title,
        LocalDateTime scheduledAt,
        Integer durationSec,
        String status,
        String leaderName,
        String memberName,
        boolean surveySubmitted
) {}
