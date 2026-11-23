package com.readb.controller;

import com.readb.common.response.ApiResponse;
import com.readb.dto.user.PasswordChangeRequest;
import com.readb.dto.user.UserProfileResponse;
import com.readb.dto.user.UserUpdateRequest;
import com.readb.service.user.ProfileImageService;
import com.readb.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ProfileImageService profileImageService;

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

    @PutMapping(value = "/me/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> uploadMyProfileImage(
            @AuthenticationPrincipal Long userId,
            @RequestPart("image") MultipartFile image) {
        profileImageService.upload(userId, image);
        return ApiResponse.ok();
    }

    @DeleteMapping("/me/profile-image")
    public ApiResponse<Void> deleteMyProfileImage(@AuthenticationPrincipal Long userId) {
        profileImageService.delete(userId);
        return ApiResponse.ok();
    }

    // 이미지 바이트를 그대로 내려준다. 이미지가 없으면 204.
    @GetMapping("/{userId}/profile-image")
    public ResponseEntity<byte[]> getProfileImage(
            @AuthenticationPrincipal Long requesterId,
            @PathVariable Long userId) {
        return profileImageService.get(requesterId, userId)
                .map(image -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(image.getContentType()))
                        .cacheControl(CacheControl.noCache().cachePrivate())
                        .body(image.getData()))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
