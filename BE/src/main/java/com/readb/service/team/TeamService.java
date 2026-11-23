package com.readb.service.team;

import com.readb.common.exception.BusinessException;
import com.readb.common.exception.ErrorCode;
import com.readb.domain.team.Team;
import com.readb.domain.user.User;
import com.readb.dto.team.TeamCreateRequest;
import com.readb.dto.team.TeamCreateResponse;
import com.readb.dto.team.TeamInviteCodeResponse;
import com.readb.dto.team.TeamJoinRequest;
import com.readb.dto.team.TeamJoinResponse;
import com.readb.dto.team.TeamMemberResponse;
import com.readb.dto.team.TeamUpdateRequest;
import com.readb.dto.team.TeamUpdateResponse;
import com.readb.repository.TeamRepository;
import com.readb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    @Transactional
    public TeamCreateResponse createTeam(Long leaderId, TeamCreateRequest request) {
        User leader = userRepository.findById(leaderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (leader.getTeamId() != null) {
            throw new BusinessException(ErrorCode.ALREADY_IN_TEAM);
        }

        String inviteCode = generateInviteCode();

        Team team = Team.builder()
                .name(request.name())
                .leaderId(leaderId)
                .inviteCode(inviteCode)
                .build();
        Team saved = teamRepository.save(team);

        leader.assignTeam(saved.getId());

        return TeamCreateResponse.from(saved);
    }

    @Transactional
    public TeamJoinResponse joinTeam(Long memberId, TeamJoinRequest request) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (member.getTeamId() != null) {
            throw new BusinessException(ErrorCode.ALREADY_IN_TEAM);
        }

        Team team = teamRepository.findByInviteCode(request.inviteCode())
                .orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));

        member.assignTeam(team.getId());

        return new TeamJoinResponse(team.getId(), team.getName());
    }

    // 팀 이름은 해당 팀의 리더만 바꿀 수 있다.
    @Transactional
    public TeamUpdateResponse renameTeam(Long requesterId, Long teamId, TeamUpdateRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
        if (!team.getLeaderId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        team.rename(request.name().trim());
        return new TeamUpdateResponse(team.getId(), team.getName());
    }

    // 초대 코드를 새로 만든다. 기존 코드는 즉시 쓸 수 없게 되고, 이미 가입한 멤버에게는 영향이 없다.
    @Transactional
    public TeamInviteCodeResponse regenerateInviteCode(Long requesterId, Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TEAM_NOT_FOUND));
        if (!team.getLeaderId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        team.changeInviteCode(generateInviteCode());
        return new TeamInviteCodeResponse(team.getId(), team.getInviteCode());
    }

    private String generateInviteCode() {
        // 6자리 16진수라 충돌 가능성은 낮지만, unique 제약 위반을 피하려고 사용 중인 코드면 다시 뽑는다.
        for (int i = 0; i < 5; i++) {
            String code = "READB-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            if (!teamRepository.existsByInviteCode(code)) return code;
        }
        throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new BusinessException(ErrorCode.TEAM_NOT_FOUND);
        }
        return userRepository.findByTeamId(teamId).stream()
                .map(u -> new TeamMemberResponse(u.getId(), u.getName(), u.getEmail(), u.getRole().name()))
                .toList();
    }
}
