package com.ly.chatbe.modal;// Channel.java

import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class Channel {
    private String channelId;
    private String channelName;
    private Set<String> members = new HashSet<>();

    public Channel(String channelId, String channelName) {
        this.channelId = channelId;
        this.channelName = channelName;
    }

    // getters and setters
}
