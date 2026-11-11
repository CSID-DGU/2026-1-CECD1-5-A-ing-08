package com.readb.controller;

import com.readb.common.exception.BusinessException;
import com.readb.domain.meeting.Meeting;
import com.readb.repository.MeetingRepository;
import com.readb.service.talk.SseEmitterRegistry;
import com.readb.service.talk.TalkRatioService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class TalkRatioControllerTest {
    private final TalkRatioService service = mock(TalkRatioService.class);
    private final SseEmitterRegistry registry = mock(SseEmitterRegistry.class);
    private final MeetingRepository meetings = mock(MeetingRepository.class);
    private final TalkRatioController controller = new TalkRatioController(service, registry, meetings);

    @Test
    void onlyTheMeetingLeaderCanSubmitAudio() throws IOException {
        when(meetings.findById(1L)).thenReturn(Optional.of(Meeting.builder()
                .id(1L).leaderId(10L).memberId(20L).build()));
        MockMultipartFile audio = new MockMultipartFile("audio", "part.wav", "audio/wav", new byte[]{1});

        assertThatThrownBy(() -> controller.processChunk(1L, 20L, audio, 2))
                .isInstanceOf(BusinessException.class);
        verifyNoInteractions(service);
        controller.processChunk(1L, 10L, audio, 2);
        verify(service).processChunk(1L, audio, 2);
    }

    @Test
    void outsidersCannotReadRatio() {
        when(meetings.findById(1L)).thenReturn(Optional.of(Meeting.builder()
                .id(1L).leaderId(10L).memberId(20L).build()));

        assertThatThrownBy(() -> controller.currentRatio(1L, 30L))
                .isInstanceOf(BusinessException.class);
    }
}
