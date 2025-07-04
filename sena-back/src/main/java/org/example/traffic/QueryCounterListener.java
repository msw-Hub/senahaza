package org.example.traffic;

import lombok.extern.slf4j.Slf4j;
import net.ttddyy.dsproxy.listener.QueryExecutionListener;
import net.ttddyy.dsproxy.QueryInfo;
import net.ttddyy.dsproxy.ExecutionInfo;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class QueryCounterListener implements QueryExecutionListener {

    @Override
    public void beforeQuery(ExecutionInfo execInfo, List<QueryInfo> queryInfoList) {
        QueryCountHolder.increment();
    }

    @Override
    public void afterQuery(ExecutionInfo execInfo, List<QueryInfo> queryInfoList) {
    }
}
