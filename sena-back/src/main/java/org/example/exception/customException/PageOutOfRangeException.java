package org.example.exception.customException;

public class PageOutOfRangeException extends RuntimeException {
    public PageOutOfRangeException(String message) {
        super(message);
    }
}
