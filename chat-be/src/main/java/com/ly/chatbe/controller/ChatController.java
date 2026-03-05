package com.ly.chatbe.controller;

import com.ly.chatbe.modal.ChatMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final SimpMessagingTemplate simpMessagingTemplate;

    public ChatController(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }


    @MessageMapping("/chat.sendMessage/{channel}")
    public void sendMessage(@DestinationVariable String channel, @Payload ChatMessage message) {
        simpMessagingTemplate.convertAndSend("/topic/" + channel, message);
    }

    @MessageMapping("/chat.sendToGroup/{groupId}")
    public void sendToGroup(@DestinationVariable String groupId, @Payload ChatMessage message) {
        simpMessagingTemplate.convertAndSend("/queue/group/" + groupId, message);
    }

    @MessageMapping("/chat.sendToUser/{username}")
    public void sendToUser(@DestinationVariable String username, @Payload ChatMessage message) {
        simpMessagingTemplate.convertAndSendToUser(username, "/queue/private", message);
    }
}
