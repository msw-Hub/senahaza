package org.example.redis;

import lombok.RequiredArgsConstructor;
import org.example.entity.BlockedIpEntity;
import org.example.repository.BlockedIpRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BlockedIpService {

    private final BlockedIpRepository blockedIpRepository;

    public void blockIp(String ip, LocalDateTime blockedAt, LocalDateTime unblockAt, String reason) {
        BlockedIpEntity entity = BlockedIpEntity.builder()
                .ip(ip)
                .blockedAt(blockedAt)
                .unblockAt(unblockAt)
                .reason(reason)
                .build();

        blockedIpRepository.save(entity);
    }

}
