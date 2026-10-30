package com.readb.service.analysis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.readb.domain.analysis.PreBriefingType;
import com.readb.dto.meeting.PreBriefingResponse.CoachingGuide;
import com.readb.repository.MeetingPostCoachingRepository;
import com.readb.repository.MeetingPreBriefingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GeneratedGuideServiceTest {

    @Test
    void 동시에_같은_가이드를_요청하면_LLM은_한_번만_호출된다() throws Exception {
        MeetingPreBriefingRepository preRepo = mock(MeetingPreBriefingRepository.class);
        when(preRepo.findByMeetingIdAndType(any(), any())).thenReturn(Optional.empty());
        GeneratedGuideService service = new GeneratedGuideService(
                preRepo, mock(MeetingPostCoachingRepository.class), new ObjectMapper(),
                mock(PlatformTransactionManager.class));

        CoachingGuide guide = new CoachingGuide("집중", "요약", List.of(), List.of("질문 1", "질문 2"));
        AtomicInteger calls = new AtomicInteger();
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        CompletableFuture<CoachingGuide> first = CompletableFuture.supplyAsync(() ->
                service.getOrGeneratePre(6L, PreBriefingType.BASE, CoachingGuide.class, () -> {
                    calls.incrementAndGet();
                    started.countDown();
                    await(release);
                    return guide;
                }));
        assertThat(started.await(5, TimeUnit.SECONDS)).isTrue();

        // 첫 생성이 진행 중일 때 들어온 두 번째 요청
        Thread second = new Thread(() -> service.getOrGeneratePre(6L, PreBriefingType.BASE, CoachingGuide.class,
                () -> { calls.incrementAndGet(); return guide; }));
        second.start();
        long deadline = System.currentTimeMillis() + 5_000;
        while (second.getState() != Thread.State.WAITING && System.currentTimeMillis() < deadline) {
            Thread.onSpinWait();
        }
        assertThat(second.getState()).isEqualTo(Thread.State.WAITING);

        release.countDown();
        assertThat(first.get(5, TimeUnit.SECONDS)).isEqualTo(guide);
        second.join(5_000);
        assertThat(calls.get()).isEqualTo(1);
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
