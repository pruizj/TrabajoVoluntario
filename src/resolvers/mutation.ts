import { Db, ObjectId } from "mongodb";
import { v4 as uuid } from "uuid";
import { ApolloError } from "apollo-server";
const config = require('../config');
const bcryptjs = require('bcryptjs');
import { connectDB } from "../mongo";
import { Message, Channel, User } from "../types"
import { pubsub } from "../app";

export const Mutation = {
  signin: async (parent: any, { email, password }: { email: string, password: string }, { db }: { db: Db }) => {
    const user = await db.collection("usuarios").findOne({ email: email });
    if (user) {
      throw new ApolloError("User already exists", "403");
    }

    const hash_password = await bcryptjs.hash(password, config.BCRYPT_SALT);
    await db.collection("usuarios")
      .insertOne({
        "email": email,
        "pwd": hash_password,
        "token": undefined,
      });

    return "You've been register";

  },

  signout: async (parent: any, args: any, { db, user }: { db: Db, user: any }) => {

    await db.collection("usuarios").deleteOne(user);
    return "User delete";

  },

  login: async (parent: any, { email, password }: { email: string, password: string }, { db }: { db: Db }) => {
    const token_key: string = uuid();

    const user = await db.collection("usuarios").findOne({ email: email });
    if (!user) {
      throw new ApolloError("User does not exist", "403");
    }

    const isMatch = await bcryptjs.compare(password, user.pwd)
    if (isMatch) {
      const filter = { email: email };
      const updateDoc = {
        $set: {
          token: token_key
        }
      };
      await db.collection("usuarios").updateOne(filter, updateDoc);

      return token_key;
    }
    throw new ApolloError("Password incorrect", "403");
  },

  logout: async (parent: any, args: any, { db, user }: { db: Db, user: any }) => {
    const filter = { token: user.token };
    const updateDoc = {
      $set: {
        token: undefined
      }
    };
    await db.collection("usuarios").updateOne(filter, updateDoc);
    return "You have logged out";
  },

  join: async (parent: any, { channelName }: { channelName: string }, { db, user, channels }: { db: Db, user: User, channels: Channel[] }) => {
    let channel: Channel = {
      name: "",
      participants: [],
      messages: []
    }
    if (channels.length == 0) {
      let usuario: User[] = [user];
      channel.name = channelName;
      channel.participants = usuario;
      channel.messages = [];
      channels.push(channel);
    } else {
      let encontrado: boolean = false;
      for (let i = 0; i < channels.length; i++) {
        if (channels[i].name == channelName) {
          channel = channels[i];
          channels[i].participants.push(user);
          encontrado = true;
        }
      }
      if (encontrado = false) {
        let usuario: User[] = [user];
        channel.name = channelName;
        channel.participants = usuario;
        channel.messages = [];
        channels.push(channel);
      }
    }
    pubsub.publish('onMemberJoin', { onMemberJoin: { user, channel } });
    return {
      channel,
      user
    }
  },

  sendMessage: async (parent: any, { channelName, text }: { channelName: string, text: string }, { db, user, channels }: { db: Db, user: User, channels: Channel[] }) => {
    let channel: Channel = {
      name: "",
      participants: [],
      messages: []
    }
    for (let i = 0; i < channels.length; i++) {
      if (channels[i].name == channelName) {
        channel = channels[i];
      }
    }
    const newMessage: Message = {
      createdBy: user,
      channel: channel,
      text: text
    }
    for (let i = 0; i < channels.length; i++) {
      if (channels[i].name == channelName) {
        channels[i].messages.push(newMessage);
      }
    }

    pubsub.publish('onMessageAdded', { onMessageAdded: newMessage });
    return newMessage;
  },

  quit: async (parent: any, { channelName }: { channelName: string }, { db, user, channels }: { db: Db, user: User, channels: Channel[] }) => {
    let channelss: Channel[] = [];
    let channel: Channel = {
      name: "",
      participants: [],
      messages: []
    }
    for (let i = 0; i < channels.length; i++) {
      if (channels[i].name == channelName) {
        channel = channels[i];
        let u: User[] = [];
        let usuarios = channels[i].participants;

        for (let j = 0; j < usuarios.length; j++) {
          if (usuarios[j] != user) {
            u.push(usuarios[j]);
          }
        }

        channels[i].participants = u;
      }
      if (channels[i].participants.length != 0) {
        channelss.push(channelss[i]);
      }
    }
    channels = channelss;
    pubsub.publish('onQuit', { onQuit: channel });
    return channel;
  }

}
