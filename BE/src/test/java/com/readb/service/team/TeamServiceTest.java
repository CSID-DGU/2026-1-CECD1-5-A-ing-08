package com.readb.service.team;

import com.readb.common.exception.BusinessException;
import com.readb.common.exception.ErrorCode;
import com.readb.domain.team.Team;
import com.readb.dto.team.TeamUpdateRequest;
import com.readb.dto.team.TeamUpdateResponse;
import com.readb.repository.TeamRepository;
import com.readb.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private UserRepository userRepository;

    private TeamService teamService;

    @BeforeEach
    void setUp() {
        teamService = new TeamService(teamRepository, userRepository);
    }

    @Test
    void 팀_리더는_팀_이름을_바꿀_수_있다() {
        Team team = Team.builder().id(10L).name("Product A팀").leaderId(1L).build();
        when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

        TeamUpdateResponse res = teamService.renameTeam(1L, 10L, new TeamUpdateRequest("  플랫폼팀  "));

        assertThat(res.teamName()).isEqualTo("플랫폼팀");
        assertThat(team.getName()).isEqualTo("플랫폼팀");
    }

    @Test
    void 다른_팀의_리더는_이름을_바꿀_수_없다() {
        Team team = Team.builder().id(10L).name("Product A팀").leaderId(1L).build();
        when(teamRepository.findById(10L)).thenReturn(Optional.of(team));

        assertThatThrownBy(() -> teamService.renameTeam(2L, 10L, new TeamUpdateRequest("플랫폼팀")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
        assertThat(team.getName()).isEqualTo("Product A팀");
    }
}
