package org.example.exception.customException;

import lombok.Getter;

import java.util.Map;

@Getter
public class ValidationFailedException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public ValidationFailedException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }

}
