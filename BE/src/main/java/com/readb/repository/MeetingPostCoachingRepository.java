package com.readb.repository;

import com.readb.domain.analysis.MeetingPostCoaching;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MeetingPostCoachingRepository extends JpaRepository<MeetingPostCoaching, Long> {
    Optional<MeetingPostCoaching> findByMeetingId(Long meetingId);
    void deleteByMeetingId(Long meetingId);
}