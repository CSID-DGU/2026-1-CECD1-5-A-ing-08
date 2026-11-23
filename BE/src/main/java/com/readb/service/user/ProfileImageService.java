package com.readb.service.user;

import com.readb.common.exception.BusinessException;
import com.readb.common.exception.ErrorCode;
import com.readb.domain.user.User;
import com.readb.domain.user.UserProfileImage;
import com.readb.repository.UserProfileImageRepository;
import com.readb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileImageService {

    // FE가 256×256으로 줄여 40KB 안팎으로 압축해 보낸다. 서버는 넉넉하게 100KB까지 받는다.
    static final int MAX_BYTES = 100 * 1024;

    private final UserProfileImageRepository profileImageRepository;
    private final UserRepository userRepository;

    @Transactional
    public void upload(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BusinessException(ErrorCode.INVALID_FILE_FORMAT);
        if (file.getSize() > MAX_BYTES) throw new BusinessException(ErrorCode.PROFILE_IMAGE_TOO_LARGE);
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        String contentType = detectContentType(data);
        if (contentType == null) throw new BusinessException(ErrorCode.INVALID_FILE_FORMAT);

        profileImageRepository.findById(userId).ifPresentOrElse(
                image -> image.replace(contentType, data),
                () -> profileImageRepository.save(UserProfileImage.builder()
                        .userId(userId).contentType(contentType).data(data).build()));
    }

    @Transactional
    public void delete(Long userId) {
        profileImageRepository.deleteById(userId);
    }

    // 본인 또는 같은 팀 사람만 볼 수 있다.
    @Transactional(readOnly = true)
    public Optional<UserProfileImage> get(Long requesterId, Long targetUserId) {
        if (!requesterId.equals(targetUserId)) {
            User requester = findUser(requesterId);
            User target = findUser(targetUserId);
            if (requester.getTeamId() == null || !Objects.equals(requester.getTeamId(), target.getTeamId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }
        return profileImageRepository.findById(targetUserId);
    }

    // 확장자나 요청 헤더 대신 파일 앞부분(매직 넘버)으로 형식을 판별한다.
    static String detectContentType(byte[] d) {
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') return "image/png";
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') return "image/webp";
        return null;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
