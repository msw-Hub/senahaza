package org.example.exception.customException;

public class InvalidFileException extends RuntimeException{
    public InvalidFileException(String message) {
        super(message);
    }
}
