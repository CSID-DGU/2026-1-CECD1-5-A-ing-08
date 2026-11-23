package com.readb.domain.talk;

import java.util.ArrayDeque;
import java.util.Deque;

public class TalkSession {
    private SpeakerProfile leaderProfile;
    private SpeakerProfile memberProfile;
    private long leaderMs = 0;
    private long memberMs = 0;
    private long unclassifiedMs = 0;
    private int lastSequence = -1;
    private final Deque<ClassifiedSpeech> recent = new ArrayDeque<>();

    public void setLeaderProfile(SpeakerProfile p) { this.leaderProfile = p; }
    public void setMemberProfile(SpeakerProfile p) { this.memberProfile = p; }
    public SpeakerProfile getLeaderProfile() { return leaderProfile; }
    public SpeakerProfile getMemberProfile() { return memberProfile; }

    public synchronized void addSpeech(ClassifiedSpeech speech) {
        leaderMs += speech.leaderMs();
        memberMs += speech.memberMs();
        unclassifiedMs += speech.unclassifiedMs();
        recent.addLast(speech);
        if (recent.size() > 24) recent.removeFirst(); // About two minutes at a 5s chunk interval.
    }

    public boolean isCalibrated() {
        return leaderProfile != null && memberProfile != null;
    }

    public synchronized double leaderRatio() {
        long total = leaderMs + memberMs;
        if (total == 0) return 0.0;
        return Math.round(leaderMs * 1000.0 / total) / 10.0;
    }

    public synchronized double recentLeaderRatio() {
        long leader = recent.stream().mapToLong(ClassifiedSpeech::leaderMs).sum();
        long member = recent.stream().mapToLong(ClassifiedSpeech::memberMs).sum();
        return leader + member == 0 ? 0 : Math.round(leader * 1000.0 / (leader + member)) / 10.0;
    }

    public synchronized double unclassifiedRatio() {
        long total = leaderMs + memberMs + unclassifiedMs;
        return total == 0 ? 0 : Math.round(unclassifiedMs * 1000.0 / total) / 10.0;
    }

    public synchronized long classifiedMs() { return leaderMs + memberMs; }
    public synchronized long recentClassifiedMs() {
        return recent.stream().mapToLong(s -> s.leaderMs() + s.memberMs()).sum();
    }
    public synchronized long getLeaderMs() { return leaderMs; }
    public synchronized long getMemberMs() { return memberMs; }
    public synchronized long getUnclassifiedMs() { return unclassifiedMs; }
    public synchronized boolean alreadyProcessed(int sequence) { return sequence <= lastSequence; }
    public synchronized void markProcessed(int sequence) { lastSequence = sequence; }
}
