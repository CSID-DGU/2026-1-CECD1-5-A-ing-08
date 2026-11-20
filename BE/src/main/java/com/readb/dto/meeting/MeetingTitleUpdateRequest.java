package com.readb.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MeetingTitleUpdateRequest(
        @NotBlank @Size(max = 100) String title
) {}
