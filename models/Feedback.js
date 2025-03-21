const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const feedbackschema =new Schema({

    id :{
        type:String,
        required :true
    },
    name:{
        type:String,
        required : true
    },
    Email:{
        type:String,
        required : true
    },
    section:{
        type:String,
        required : true
    },
    message:{
        type:String,
        required : true
    },
    percentage:{
        type:String,
        required : true
    }

})

const Feedback = mongoose.model("Feedback",feedbackschema);

module.exports =Feedback;