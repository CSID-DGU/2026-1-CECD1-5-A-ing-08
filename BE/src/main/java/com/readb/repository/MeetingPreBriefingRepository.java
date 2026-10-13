package com.readb.repository;

import com.readb.domain.analysis.PreBriefingType;
import com.readb.domain.analysis.MeetingPreBriefing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MeetingPreBriefingRepository extends JpaRepository<MeetingPreBriefing, Long> {
    Optional<MeetingPreBriefing> findByMeetingIdAndType(Long meetingId, PreBriefingType type);
}
