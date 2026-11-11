package com.readb.dto.talk;

import com.readb.domain.talk.TalkSession;

public record TalkRatioEvent(
        double leaderRatio,
        double memberRatio,
        double recentLeaderRatio,
        long recentClassifiedMs,
        double unclassifiedRatio,
        boolean hasData) {
    public static TalkRatioEvent of(TalkSession session) {
        double leader = session.leaderRatio();
        return new TalkRatioEvent(leader, session.classifiedMs() == 0 ? 0 : Math.round((100 - leader) * 10.0) / 10.0,
                session.recentLeaderRatio(), session.recentClassifiedMs(),
                session.unclassifiedRatio(), session.classifiedMs() > 0);
    }

    public static TalkRatioEvent empty() {
        return new TalkRatioEvent(0, 0, 0, 0, 0, false);
    }
}
