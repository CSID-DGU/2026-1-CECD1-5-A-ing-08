package com.readb.domain.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// 프로필 이미지(256×256, 최대 100KB)는 users와 분리해 저장한다.
// User를 조회할 때마다 이미지 바이트까지 읽지 않도록 하기 위함.
@Entity
@Table(name = "user_profile_images")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserProfileImage {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "content_type", nullable = false, length = 20)
    private String contentType;

    // length를 지정하지 않으면 일부 DB(H2 테스트)에서 255바이트 컬럼이 된다. PostgreSQL에서는 BYTEA.
    @Column(nullable = false, length = 102400)
    private byte[] data;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
    }
}
