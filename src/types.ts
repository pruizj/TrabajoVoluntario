export type Message = {
    createdBy: User
    channel: Channel
    text: string
}

export type Channel = {
    name: string
    participants: User[]
    messages: Message[]
}

export type User = {
    _id: string
    email: string
    pwd: string
    token: string
}