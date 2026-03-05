package com.ly.chatbe.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The entry point for the frontend to connect
        registry.addEndpoint("/ws-chat")
                .setAllowedOrigins("http://localhost:3000") // React URL
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic = Public Channels (Broadcast)
        // /queue = Private Groups (Targeted)
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages sent FROM client TO server
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific messaging (Private)
        registry.setUserDestinationPrefix("/user");
    }
}