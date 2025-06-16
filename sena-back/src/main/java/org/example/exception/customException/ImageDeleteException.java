package org.example.exception.customException;

public class ImageDeleteException extends RuntimeException{
    public ImageDeleteException(String message) {
        super(message);
    }
}
