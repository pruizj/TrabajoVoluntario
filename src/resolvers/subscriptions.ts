import { pubsub } from "../app";
export const Subscription = {
    onMessageAdded: {
        subscribe: (parent: any, args: any, context: any) => {
            const asyncIterator = pubsub.asyncIterator('onMessageAdded');
            return asyncIterator;
        }
    },

    onMemberJoin: {
        subscribe: (parent: any, args: any, context: any) => {
            const asyncIterator = pubsub.asyncIterator('onMemberJoin');
            return asyncIterator;
        }
    },

    onQuit: {
        subscribe: (parent: any, args: any, context: any) => {
            const asyncIterator = pubsub.asyncIterator('onQuit');
            return asyncIterator;
        }
    }
}