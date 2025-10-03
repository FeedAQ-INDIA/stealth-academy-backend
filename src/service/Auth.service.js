const db = require("../entity/index.js");
const lodash = require("lodash")
const logger = require('../config/winston.config.js');
const { addCreditTransaction } = require("./CreditService.service.js");


const getInitials = (name) => {
    const trimmedName = name.trim();

    if (!trimmedName.includes(" ")) {
        return trimmedName.slice(0, 2).toUpperCase();
    }

    const words = trimmedName.split(" ").filter(word => word.length > 0);
    const initials = words.map(word => word.charAt(0).toUpperCase()).join("");

    return initials.slice(0, 2);
};


async function createUser(firstName, lastName, email, number) {
    const user = {
        firstName: firstName, lastName: lastName, email: email, number: number, nameInitial:getInitials(firstName+" "+lastName)
    };
    const [data, created] = await db.User.findOrCreate({
        where: {
            email: email,
        }, defaults: user,
    });
    console.log(data.userId);

    if(created == true){
       await addCreditTransaction({ userId: data.userId, transactionType: 'CREDIT', referenceType: 'SIGN_UP_BONUS', amount: 100.00, description: 'Initial credit on signup', metadata: null });
    }
    console.log(data.userId);
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
