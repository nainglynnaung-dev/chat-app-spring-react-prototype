import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client = null;

export const connectWebSocket = (onMessageReceived) => {
  client = new Client({
    // Use SockJS instead of native WebSocket
    webSocketFactory: () => new SockJS("http://localhost:8080/ws-chat"),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("Connected to WebSocket");

      // Subscribe to a channel
      client.subscribe("/topic/c1", (message) => {
        onMessageReceived(JSON.parse(message.body));
      });

      // Subscribe to private queue
      client.subscribe("/user/queue/private", (message) => {
        onMessageReceived(JSON.parse(message.body));
      });
    },
  });

  client.activate();
};

export const sendMessageToChannel = (channel, msg) => {
  client.publish({
    destination: `/app/chat.sendMessage/${channel}`,
    body: JSON.stringify(msg),
  });
};

export const sendMessageToGroup = (groupId, msg) => {
  client.publish({
    destination: `/app/chat.sendToGroup/${groupId}`,
    body: JSON.stringify(msg),
  });
};

export const sendMessageToUser = (username, msg) => {
  client.publish({
    destination: `/app/chat.sendToUser/${username}`,
    body: JSON.stringify(msg),
  });
};
