package com.ly.chatbe.modal;

import lombok.Data;

import java.awt.*;

@Data
public class ChatMessage {
    private String sender;
    private String receiver;
    private String content;
    private String type; // CHANNEL, GROUP, USER
    private String sticker; // URL or name of sticker
    private String replyContent;
    private String replySender;
}
