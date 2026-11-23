package com.readb.controller;

import com.readb.common.util.JwtUtil;
import com.readb.domain.user.User;
import com.readb.domain.user.UserRole;
import com.readb.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 실제 DB 매핑(byte[] ↔ 컬럼)과 multipart 업로드까지 전체 흐름을 확인한다.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProfileImageApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    @Test
    void 업로드한_이미지를_그대로_돌려주고_삭제하면_204() throws Exception {
        User user = userRepository.save(User.builder().email("img@test.com").passwordHash("x")
                .name("이미지").role(UserRole.MEMBER).build());
        String auth = "Bearer " + jwtUtil.generateAccessToken(user.getId(), user.getEmail(), "MEMBER");
        // 실제 업로드와 비슷한 50KB 크기
        byte[] png = new byte[50 * 1024];
        System.arraycopy(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}, 0, png, 0, 8);

        mockMvc.perform(get("/api/v1/users/" + user.getId() + "/profile-image").header("Authorization", auth))
                .andExpect(status().isNoContent());

        mockMvc.perform(multipart("/api/v1/users/me/profile-image")
                        .file(new MockMultipartFile("image", "a.png", "image/png", png))
                        .with(r -> { r.setMethod("PUT"); return r; })
                        .header("Authorization", auth))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/users/" + user.getId() + "/profile-image").header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(png));

        mockMvc.perform(delete("/api/v1/users/me/profile-image").header("Authorization", auth))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/users/" + user.getId() + "/profile-image").header("Authorization", auth))
                .andExpect(status().isNoContent());
    }
}
