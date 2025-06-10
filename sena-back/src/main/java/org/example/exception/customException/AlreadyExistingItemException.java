package org.example.exception.customException;

public class AlreadyExistingItemException extends RuntimeException{
    public AlreadyExistingItemException(String message) {
        super(message);
    }
}
