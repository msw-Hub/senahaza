package org.example.exception.customException;

public class AnalyticsReportException extends RuntimeException {
    public AnalyticsReportException(String message) {
        super(message);
    }

    public AnalyticsReportException(String message, Throwable cause) {
        super(message, cause);
    }
}
