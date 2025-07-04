package org.example.exception.customException;

public class AdminStatusInvalidException extends RuntimeException {
    public AdminStatusInvalidException(String message) {
        super(message);
    }
}
