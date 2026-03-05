package com.ly.chatbe.modal;// ChatStore.java



import java.util.*;

public class ChatStore {
    public static Map<String, User> users = new HashMap<>();
    public static Map<String, GroupChat> groups = new HashMap<>();
    public static Map<String, Channel> channels = new HashMap<>();

    static {
        // Dummy users
        users.put("alice", new User("alice", "password"));
        users.put("bob", new User("bob", "password"));
        users.put("admin", new User("admin", "admin"));

        // Dummy group
        GroupChat g1 = new GroupChat("g1", "Friends");
        g1.getMembers().add("alice");
        g1.getMembers().add("bob");
        groups.put("g1", g1);

        // Dummy channel
        Channel c1 = new Channel("c1", "General");
        c1.getMembers().add("alice");
        c1.getMembers().add("bob");
        channels.put("c1", c1);
    }
}
