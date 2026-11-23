package com.readb.service.talk;

import com.readb.common.exception.BusinessException;
import com.readb.domain.talk.SpeakerProfile;
import com.readb.domain.talk.ClassifiedSpeech;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class TalkRatioServiceTest {

    @Mock AudioAnalyzer audioAnalyzer;
    @Mock SseEmitterRegistry sseEmitterRegistry;
    @Mock MultipartFile mockFile;

    TalkRatioService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new TalkRatioService(audioAnalyzer, sseEmitterRegistry);
    }

    @Test
    void calibrateLeader_storesLeaderProfile() throws IOException {
        byte[] pcm = new byte[1600];
        SpeakerProfile profile = new SpeakerProfile(new double[20], Math.log(180), 5000);
        when(audioAnalyzer.toPcm(mockFile)).thenReturn(pcm);
        when(audioAnalyzer.extractProfile(pcm)).thenReturn(profile);

        service.calibrateLeader(1L, mockFile);

        assertThat(service.getSession(1L).getLeaderProfile()).isEqualTo(profile);
    }

    @Test
    void calibrateMember_storesMemberProfile() throws IOException {
        byte[] pcm = new byte[1600];
        SpeakerProfile profile = new SpeakerProfile(new double[20], Math.log(320), 5000);
        when(audioAnalyzer.toPcm(mockFile)).thenReturn(pcm);
        when(audioAnalyzer.extractProfile(pcm)).thenReturn(profile);

        service.calibrateMember(1L, mockFile);

        assertThat(service.getSession(1L).getMemberProfile()).isEqualTo(profile);
    }

    @Test
    void processChunk_notCalibrated_throwsException() {
        assertThatThrownBy(() -> service.processChunk(99L, mockFile, 2))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void processChunk_calibrated_pushesRatio() throws IOException {
        SpeakerProfile leaderProfile = new SpeakerProfile(new double[20], Math.log(180), 5000);
        SpeakerProfile memberProfile = new SpeakerProfile(new double[20], Math.log(320), 5000);
        byte[] calibPcm = new byte[1600];
        when(audioAnalyzer.toPcm(mockFile)).thenReturn(calibPcm);
        when(audioAnalyzer.extractProfile(calibPcm)).thenReturn(leaderProfile, memberProfile);
        service.calibrateLeader(1L, mockFile);
        service.calibrateMember(1L, mockFile);

        byte[] chunkPcm = new byte[16000 * 10 * 2];
        when(audioAnalyzer.toPcm(mockFile)).thenReturn(chunkPcm);
        when(audioAnalyzer.classifyChunk(chunkPcm, leaderProfile, memberProfile))
                .thenReturn(new ClassifiedSpeech(7000L, 3000L, 0));

        service.processChunk(1L, mockFile, 2);

        verify(sseEmitterRegistry).push(eq(1L), argThat(e -> e.leaderRatio() == 70.0));
        service.processChunk(1L, mockFile, 2);
        assertThat(service.getSession(1L).getLeaderMs()).isEqualTo(7000L);
    }

    @Test
    void unclassifiedSpeechDoesNotIncreaseLeaderRatio() throws IOException {
        byte[] pcm = new byte[1600];
        SpeakerProfile profile = new SpeakerProfile(new double[20], Math.log(180), 5000);
        when(audioAnalyzer.toPcm(mockFile)).thenReturn(pcm);
        when(audioAnalyzer.extractProfile(pcm)).thenReturn(profile);
        service.calibrateLeader(1L, mockFile);
        service.calibrateMember(1L, mockFile);
        when(audioAnalyzer.classifyChunk(pcm, profile, profile))
                .thenReturn(new ClassifiedSpeech(0, 1000, 3000));

        service.processChunk(1L, mockFile, 2);

        assertThat(service.getSession(1L).leaderRatio()).isZero();
        assertThat(service.getSession(1L).getUnclassifiedMs()).isEqualTo(3000);
    }
}
