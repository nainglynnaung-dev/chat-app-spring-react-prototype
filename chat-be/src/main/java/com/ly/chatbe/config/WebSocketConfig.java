package com.ly.chatbe.config;

import org.jspecify.annotations.Nullable;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*") // More permissive for dev
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
//            public Message<?> preSend(Message<?> message, MessageChannel channel) {
//                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
//                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
//                    // Important: Extract 'login' from headers and set as Principal
//                    String user = accessor.getFirstNativeHeader("login");
//                    if (user != null && !user.isEmpty()) {
//                        final String finalUser = user.toLowerCase();
//                        accessor.setUser(() -> finalUser);
//                        System.out.println("USER CONNECTED: " + finalUser);
//                    }
//                }
//                return message;
//            }
            
            @Override
            public @Nullable Message<?> preSend(Message<?> message, MessageChannel channel) {
            	StompHeaderAccesor accessor=MessageHeaderAccessor.getAccessor(message,StompHeaderAccessor.class);
            	if(accessor !=null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            		String user=accessor.getFirstNativeHeader("login");
            		if(user != null && !user.isEmpty(){
            			final String finalUser=user.toLowerCase();
            			accessor.setUser(()->finalUser);
            			System.out.println("User COnnected: "+finalUser);
            		}
            	}
            	return message;
            }
        });
    }
}