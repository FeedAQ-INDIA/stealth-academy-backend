const {QueryTypes} = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const {toJSON} = require("lodash/seq");
const DynamicService = require("./DynamicService.service");

 


const saveUserLearningSchedule = async (
    userId,
    notesId,
    courseId,
    courseContentId,
    noteContent,
    noteRefTimestamp
) => {
    try {
        // Input validation
        if (!userId) throw new Error('User ID is required');
        if (!courseId) throw new Error('Course ID is required');
        if (!notesId && !courseContentId) throw new Error('Course Content ID is required');
        if (!noteContent?.trim()) throw new Error('Notes text cannot be empty');

        if (notesId) {
            const notesData = await db.Notes.findByPk(notesId);
            if (!notesData) throw new Error('Notes not found');

            // Verify ownership
            if (notesData.userId !== userId) {
                throw new Error('Unauthorized to modify these notes');
            }

            notesData.noteContent = noteContent.trim();
            await notesData.save();

            return {
                success: true,
                message: 'Notes updated successfully',
                noteId: notesData.id
            };
        } else {
            const newNote = await db.Notes.create({
                userId,
                courseId,
                courseContentId,
                noteContent: noteContent.trim(),
                noteRefTimestamp: noteRefTimestamp
            });

            return {
                success: true,
                message: 'Notes created successfully',
                noteId: newNote.id
            };
        }
    } catch (error) {
        logger.error('Error in saveNote:', error);
        throw new Error(`Failed to save notes: ${error.message}`);
    }
};

 
 

module.exports = {
    getUser,
    userCourseEnrollment,
 
 
 };

