package com.campuscare.campuscare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {
        "com.campuscare.campuscare",
        "soap.config"
})
public class CampuscareApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampuscareApplication.class, args);
    }
}