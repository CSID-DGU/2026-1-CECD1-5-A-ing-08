package com.readb.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TeamUpdateRequest(
        // 앞뒤 공백을 뺀 길이 기준 2~30자 (팀 생성 화면과 동일)
        @NotBlank @Pattern(regexp = "^\\s*\\S.{0,28}\\S\\s*$", message = "팀 이름은 2~30자로 입력해주세요.") String name
) {}
