package com.ly.chatbe.controller;

import com.ly.chatbe.modal.ChatMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;

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
    public void sendToUser(@DestinationVariable String username, Principal principal, @Payload ChatMessage message) {
        String sender = (principal != null) ? principal.getName() : message.getSender();
        message.setSender(sender);
        message.setReceiver(username);
        
        System.out.println("USER_MSG: [" + sender + "] -> [" + username + "] Content: " + message.getContent());
        
        // Send to the recipient
        simpMessagingTemplate.convertAndSendToUser(username, "/queue/private", message);
        
        // Also send back to the sender so all their sessions (tabs/devices) are in sync
        if (principal != null && !username.equalsIgnoreCase(sender)) {
            System.out.println("LOOPBACK_MSG: [" + sender + "] -> [" + sender + "] (Syncing sessions)");
            simpMessagingTemplate.convertAndSendToUser(sender, "/queue/private", message);
        }
    }
}
