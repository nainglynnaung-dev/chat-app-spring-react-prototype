package com.ly.chatbe.modal;

import lombok.Data;

import java.awt.*;

@Data
public class ChatMessage {
    private String sender;
    private String content;
    private MessageType type;
}
