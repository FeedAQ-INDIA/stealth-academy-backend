const {Op, fn, col, QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");

function buildPrompt(userId, items) {
    const intro = `You are an expert curriculum designer. Use the following YouTube video series to create a structured online course on "Cybersecurity Architecture".\n\nEach video should become one lesson in the course.\n\nGenerate the following for each lesson:\n1. Lesson Title\n2. Summary (5-10 sentences)\n3. Category: Dynamically assign the most appropriate thematic category based on the content of the lesson.
\n4. Key Concepts (bullet points)\n5. 6-10 Flashcards (Question-Answer pairs)\n6. 6-10 Multiple Choice Quiz Questions with 1 correct answer and 3 distractors\n7. Practical Tips or Notes\n8. 10-15 Multiple Choice Quiz Questions with 1 correct answer and 3 distractors for each category
`;
    console.log(items)
    const videoBlocks = items?.map((item, index) => {
        const { title, description, resourceId } = item.snippet;
        const videoId = resourceId?.videoId;
        // const link = `https://www.youtube.com/watch?v=${videoId}`;
        return `${index + 1}. Title: ${title}\n   Description: ${description}\n   `;
    }).join('\n\n');

    const outro = `\n\nOutput in JSON format under top-level key "courseLessons".`;

    return intro + videoBlocks + outro;
}


module.exports = {
    buildPrompt
};

