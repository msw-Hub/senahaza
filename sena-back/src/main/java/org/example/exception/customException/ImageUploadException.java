package org.example.exception.customException;

public class ImageUploadException extends RuntimeException{
    public ImageUploadException(String message) {
        super(message);
    }
}
