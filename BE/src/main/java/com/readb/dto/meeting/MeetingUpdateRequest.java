package com.readb.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

// 수정 폼이 현재 값을 채워 두 필드를 항상 함께 보낸다. scheduledAt null = 일정 미정
public record MeetingUpdateRequest(
        @NotBlank @Size(max = 100) String title,
        LocalDateTime scheduledAt
) {}
