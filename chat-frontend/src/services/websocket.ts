import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export const connectWebSocket = (
  username: string,
  password: any,
  onConnect: () => void,
  onError: (error: any) => void,
  onMessageReceived: (msg: any) => void
) => {
  if (client && client.active) {
    client.deactivate();
  }

  client = new Client({
    webSocketFactory: () => {
       return new SockJS("http://localhost:8080/ws-chat");
    },
    connectHeaders: {
      login: username,
      passcode: password,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("Connected to WebSocket");
      
      if (client) {
        // Subscribe to user-specific queue for private messages
        client.subscribe(`/user/queue/private`, (message) => {
          onMessageReceived(JSON.parse(message.body));
        });
      }

      onConnect();
    },
    onStompError: (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
      if (onError) onError(frame);
    },
    onWebSocketError: (event) => {
        console.error("WebSocket error", event);
        if (onError) onError(event);
    }
  });

  client.activate();
};

export const subscribeToTopic = (topic: string, onMessageReceived: (msg: any) => void) => {
  if (client && client.connected) {
    return client.subscribe(topic, (message) => {
      onMessageReceived(JSON.parse(message.body));
    });
  }
  return null;
};

export const sendMessageToChannel = (channel: string, msg: any) => {
  if (client && client.connected) {
    client.publish({
      destination: `/app/chat.sendMessage/${channel}`,
      body: JSON.stringify(msg),
    });
  }
};

export const sendMessageToGroup = (groupId: string, msg: any) => {
  if (client && client.connected) {
    client.publish({
      destination: `/app/chat.sendToGroup/${groupId}`,
      body: JSON.stringify(msg),
    });
  }
};

export const sendMessageToUser = (username: string, msg: any) => {
  if (client && client.connected) {
    client.publish({
      destination: `/app/chat.sendToUser/${username}`,
      body: JSON.stringify(msg),
    });
  }
};

export const disconnectWebSocket = () => {
    if (client) {
        client.deactivate();
    }
};
