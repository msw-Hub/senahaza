package org.example.exception.customException;

public class InvalidAdminRoleException extends RuntimeException {
    public InvalidAdminRoleException(String message) {
        super(message);
    }
}
