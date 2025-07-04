package org.example.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.admin.dto.ItemResponseDto;
import org.example.common.dto.PackageListResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/main/")
public class CommonController {

    private final CommonService commonService;

    // 아이템 전체 목록 반환 - 활성화 아이템만
    @GetMapping("/items")
    public ResponseEntity<?> getItems() {
        log.info("아이템 목록 요청");
        List<ItemResponseDto> itemList = commonService.getItems();
        return ResponseEntity.ok(itemList);
    }

    // 패키지 전체 목록 반환 - 활성화 패키지만
    @GetMapping("/packages")
    public ResponseEntity<?> getPackages() {
        log.info("패키지 목록 요청");
        PackageListResponseDto packageList = commonService.getPackages();
        return ResponseEntity.ok(packageList);
    }
}
