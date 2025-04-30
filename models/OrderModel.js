const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    transactionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Finance",
        required:true
    },
    products:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true
            },
            productName:{
                type:String,
                required:true
            },
            quantity:{
                type:Number,
                required:true
            }
        }
    ],
    totalAmount:{
        type:Number,
        required:true
    },
    status:{
        type:String,
        default:"Pending"
    }
});
module.exports = mongoose.model("Order",orderSchema);