package com.readb.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotBlank @Size(min = 2, max = 20, message = "이름은 2~20자로 입력해주세요.") String name,
        @Size(max = 50, message = "직책은 50자 이하로 입력해주세요.") String jobTitle,
        @Size(max = 100, message = "한 줄 소개는 100자 이하로 입력해주세요.") String bio
) {}
