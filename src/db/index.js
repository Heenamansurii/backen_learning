import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";



const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nMongoDB connected: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("Error connecting to MongoDB: ", error);
        process.exit(1);
    }
}
export default connectDB






/*****************2nd way to connect to DB *********************
import express from "express";
const app = express()
(async() => {
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
       app.on("error", (error) => {
            console.log("ERROR: ",error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port $
                {process.env.PORT}`);
         })

     }    catch(error){
        console.error("ERROR: ",error)
        throw error
          }
        })()*/


/***************1st way to connect to DB *********************
fuction connectDB() {}
connectDB()*/
