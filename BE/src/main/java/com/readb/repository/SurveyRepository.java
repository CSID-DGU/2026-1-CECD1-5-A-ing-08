package com.readb.repository;

import com.readb.domain.survey.Survey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface SurveyRepository extends JpaRepository<Survey, Long> {
    Optional<Survey> findByMeetingIdAndMemberId(Long meetingId, Long memberId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Survey s where s.meetingId = :meetingId and s.memberId = :memberId")
    Optional<Survey> findForUpdate(@Param("meetingId") Long meetingId, @Param("memberId") Long memberId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Survey s where s.meetingId = :meetingId")
    Optional<Survey> findByMeetingIdForUpdate(@Param("meetingId") Long meetingId);
    List<Survey> findByMeetingId(Long meetingId);
    boolean existsByMeetingIdAndMemberId(Long meetingId, Long memberId);
    List<Survey> findByMeetingIdIn(List<Long> meetingIds);
    Page<Survey> findByMemberId(Long memberId, Pageable pageable);
}
