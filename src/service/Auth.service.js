const db = require("../entity/index.js");
const lodash = require("lodash")
const logger = require('../config/winston.config.js')


const getInitials = (name) => {
    // Trim the input to handle extra spaces
    const trimmedName = name.trim();

    // If there's only one word, return its first two letters in uppercase
    if (!trimmedName.includes(" ")) {
        return trimmedName.slice(0, 2).toUpperCase();
    }

    // For multiple words, split and get initials
    const words = trimmedName.split(" ");
    const initials = words.map(word => word.charAt(0).toUpperCase()).join("");

    return initials;
}

async function createUser(firstName, lastName, email, number) {
    const user = {
        firstName: firstName, lastName: lastName, email: email, number: number, nameInitial:getInitials(firstName+" "+lastName)
    };
    const [data, created] = await db.User.findOrCreate({
        where: {
            email: email,
        }, defaults: user,
    });
    console.log(data);
    return data;
}

async function updateUser(userId, firstName, lastName, orgName, email, number, transaction = null) {
    const user = {
        userId: userId, firstName: firstName, lastName: lastName,  email: email, number: number,
    };
    return await db.User.update(user, {
        where: {id: userId},
    }, {...(transaction && {transaction})});
}

async function findUser(email) {
    const data = await db.User.findOne({
        where: {
            email: email,
        },
    });
    console.log(data);
    return data;
}



module.exports = {
    findUser, createUser,
};
