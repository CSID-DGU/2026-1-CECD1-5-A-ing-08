package com.readb.controller;

import com.readb.common.response.ApiResponse;
import com.readb.dto.user.PasswordChangeRequest;
import com.readb.dto.user.UserProfileResponse;
import com.readb.dto.user.UserUpdateRequest;
import com.readb.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMyProfile(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(userService.getMyProfile(userId));
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.ok(userService.updateMyProfile(userId, request));
    }

    @PatchMapping("/me/password")
    public ApiResponse<Void> changeMyPassword(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PasswordChangeRequest request) {
        userService.changePassword(userId, request);
        return ApiResponse.ok();
    }
}
