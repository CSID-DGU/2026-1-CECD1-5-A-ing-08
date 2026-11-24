package com.readb.service.user;

import com.readb.common.exception.BusinessException;
import com.readb.common.exception.ErrorCode;
import com.readb.domain.user.User;
import com.readb.repository.UserProfileImageRepository;
import com.readb.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileImageServiceTest {

    @Mock private UserProfileImageRepository profileImageRepository;
    @Mock private UserRepository userRepository;

    private ProfileImageService service;

    @BeforeEach
    void setUp() {
        service = new ProfileImageService(profileImageRepository, userRepository);
    }

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};

    @Test
    void 형식은_파일_내용으로_판별한다() {
        assertThat(ProfileImageService.detectContentType(PNG)).isEqualTo("image/png");
        assertThat(ProfileImageService.detectContentType(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0})).isEqualTo("image/jpeg");
        assertThat(ProfileImageService.detectContentType("RIFF\0\0\0\0WEBPVP8 ".getBytes())).isEqualTo("image/webp");
        assertThat(ProfileImageService.detectContentType("<svg></svg>".getBytes())).isNull();
    }

    @Test
    void 이미지가_아니면_거부한다() {
        MockMultipartFile file = new MockMultipartFile("image", "a.png", "image/png", "<script>".getBytes());
        assertThatThrownBy(() -> service.upload(1L, file))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_FILE_FORMAT);
    }

    @Test
    void 백KB를_넘으면_거부한다() {
        byte[] big = new byte[ProfileImageService.MAX_BYTES + 1];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        MockMultipartFile file = new MockMultipartFile("image", "a.png", "image/png", big);
        assertThatThrownBy(() -> service.upload(1L, file))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.PROFILE_IMAGE_TOO_LARGE);
    }

    @Test
    void 다른_팀_사람의_이미지는_볼_수_없다() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(User.builder().id(1L).teamId(10L).build()));
        when(userRepository.findById(2L)).thenReturn(Optional.of(User.builder().id(2L).teamId(20L).build()));

        assertThatThrownBy(() -> service.get(1L, 2L))
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
    }
}
