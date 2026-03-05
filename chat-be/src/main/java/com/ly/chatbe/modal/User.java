package com.ly.chatbe.modal;// User.java


import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class User {
    private String username;
    private String password; // plain for demo
    private Set<String> groups = new HashSet<>();
    private Set<String> channels = new HashSet<>();

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // getters and setters
}
