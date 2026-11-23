package com.readb.service.user;

import com.readb.common.exception.BusinessException;
import com.readb.common.exception.ErrorCode;
import com.readb.domain.user.User;
import com.readb.domain.user.UserRole;
import com.readb.dto.user.PasswordChangeRequest;
import com.readb.dto.user.UserProfileResponse;
import com.readb.dto.user.UserUpdateRequest;
import com.readb.repository.TeamRepository;
import com.readb.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private TeamRepository teamRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, teamRepository, passwordEncoder);
    }

    private User user(String rawPassword) {
        return User.builder().id(1L).email("a@b.com").name("강다은").role(UserRole.MEMBER)
                .passwordHash(passwordEncoder.encode(rawPassword)).build();
    }

    @Test
    void 현재_비밀번호가_맞으면_새_비밀번호로_바뀐다() {
        User u = user("old-pass1!");
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        userService.changePassword(1L, new PasswordChangeRequest("old-pass1!", "new-pass2@"));

        assertThat(passwordEncoder.matches("new-pass2@", u.getPasswordHash())).isTrue();
    }

    @Test
    void 현재_비밀번호가_틀리면_거부하고_비밀번호를_유지한다() {
        User u = user("old-pass1!");
        String before = u.getPasswordHash();
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> userService.changePassword(1L, new PasswordChangeRequest("wrong", "new-pass2@")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_CURRENT_PASSWORD);
        assertThat(u.getPasswordHash()).isEqualTo(before);
    }

    @Test
    void 한_줄_소개는_null이면_유지하고_빈_값이면_지운다() {
        User u = user("old-pass1!");
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));

        UserProfileResponse set = userService.updateMyProfile(1L, new UserUpdateRequest("강다은", null, "  백엔드 개발자  "));
        assertThat(set.bio()).isEqualTo("백엔드 개발자");

        UserProfileResponse kept = userService.updateMyProfile(1L, new UserUpdateRequest("강다은", null, null));
        assertThat(kept.bio()).isEqualTo("백엔드 개발자");

        UserProfileResponse cleared = userService.updateMyProfile(1L, new UserUpdateRequest("강다은", null, " "));
        assertThat(cleared.bio()).isNull();
    }
}
