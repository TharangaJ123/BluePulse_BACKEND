const mongoose =require('mongoose');

const Schema = mongoose.Schema;

const commiSchema =  new Schema({
 
    pid: {
        type: String,
        required: true

    },
    email:{
        type: String,
        required: true 
    },
    photo: {
        type:String,
        required: true

    },
    description: {
        type:String,
        required: true

    }

})


const Commi =mongoose.model("Commi",commiSchema);


module.exports = Commi;
