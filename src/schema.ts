import { gql } from "apollo-server";

export const typeDefs = gql`
type channel {
  name: String!
  participants: [User]
  messages: [Message]
}

type Message {
  createdBy: User!
  channel: channel!
  text: String!
}

type JoinResult {
  user: User!
  channel: channel!
}

type User{
  _id: ID!
  email: String!
  pwd: String!
  token: String
}

  type Query{
    getChats:[channel]
  }

  type Mutation{
    signin(email:String!,password:String!):String
    login(email:String!,password:String!):String
    signout:String
    logout:String
    join (channelName:String!):JoinResult
    quit(channelName:String!):String
    sendMessage (channelName:String!, text:String!):Message
  }

  type Subscription {
    onQuit:channel
    onMessageAdded:Message
    onMemberJoin:JoinResult
  }
`