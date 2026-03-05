package com.ly.chatbe.modal;// GroupChat.java

import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class GroupChat {
    private String groupId;
    private String groupName;
    private Set<String> members = new HashSet<>();

    public GroupChat(String groupId, String groupName) {
        this.groupId = groupId;
        this.groupName = groupName;
    }

    // getters and setters
}
