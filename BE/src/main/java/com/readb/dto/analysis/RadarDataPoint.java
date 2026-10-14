package com.readb.dto.analysis;

// X축: 서베이 점수, Y축: Safety Score (Speech Act 기반)
// honestyGap = surveyScore - safetyScore (Fact-Based Gap)
// xValue: 레이더 X축 값. xMode "raw"면 surveyScore 원값(0~100), "centered"면 개인 평균 대비 편차
public record RadarDataPoint(
        Long memberId,
        String memberName,
        Double surveyScore,
        Double safetyScore,
        Double honestyGap,
        HonestyDirection direction,
        RiskLevel riskLevel,
        String flightRiskLabel,
        Double xValue,
        String xMode
) {}
