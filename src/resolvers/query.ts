import { ApolloError } from "apollo-server";
import { Db, ObjectId } from "mongodb";
import { v4 as uuid } from "uuid";
const config = require('../config');
const bcryptjs = require('bcryptjs');
import { connectDB } from "../mongo";
import { typeDefs } from "../schema";
import { Message, Channel, User } from "../types"
export const Query = {
    getChats: async (parent: any, args: any, { channels }: { channels: Channel[] }) => {
        return channels;
    }

}

export const channel = {
    messages: async (parent: { messages: Message[] }, args: any, { db }: { db: Db }) => {

        const messages = await Promise.all(parent.messages.map(async (elem: Message) => {
            return {
                createdBy: elem.createdBy,
                channel: elem.channel,
                text: elem.text
            };
        }));
        return messages;
    },

}



