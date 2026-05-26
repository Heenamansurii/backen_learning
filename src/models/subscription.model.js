import mongoose,{Schema} from "mongoose";   

const subscriptionSchema = new Schema({
    suscriber: {
        type:Schema.Types.ObjectId, //one is subscribed to many
        ref: "User",
    },
    channel: {
        type:Schema.Types.ObjectId, //one channel has many subscribers
        ref: "User",
    }
},
{
    timestamps:true,
    
})

export default mongoose.model("Subscription", subscriptionSchema)