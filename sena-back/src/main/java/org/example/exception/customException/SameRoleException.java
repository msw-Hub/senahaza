package org.example.exception.customException;

public class SameRoleException extends RuntimeException {
    public SameRoleException(String message) {
        super(message);
    }
}