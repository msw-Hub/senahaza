package org.example.exception.customException;


public class PendingAdminNotFoundException extends RuntimeException {
    public PendingAdminNotFoundException(String message) {
        super(message);
    }
}
