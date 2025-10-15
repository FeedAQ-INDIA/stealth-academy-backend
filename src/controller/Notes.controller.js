const NotesService = require('../service/Notes.service');
const { validationResult } = require('express-validator');
const logger = require('../config/winston.config');

class NotesController {
    /**
     * Save a note with optional file attachments
     * @swagger
     * /api/saveNote:
     *   post:
     *     tags: [Notes]
     *     summary: Save a note with optional file attachments
     *     description: Create or update a note with optional file attachments
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               notesId:
     *                 type: integer
     *                 description: Note ID for updates (optional)
     *               courseId:
     *                 type: integer
     *                 description: Course ID
     *               courseContentId:
     *                 type: integer
     *                 description: Course content ID
     *               noteContent:
     *                 type: string
     *                 description: Note text content
     *               noteRefTimestamp:
     *                 type: number
     *                 description: Reference timestamp
     *               metadata:
     *                 type: string
     *                 description: Additional metadata (JSON string)
     *               files:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *                 description: Optional file attachments
     *     responses:
     *       200:
     *         description: Note saved successfully
     *       400:
     *         description: Bad request or validation error
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    async saveNoteWithFiles(req, res, next) {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const userId = req.user.userId;
            const files = req.files || [];
            
            // Parse metadata if provided as string
            let metadata = {};
            if (req.body.metadata) {
                try {
                    metadata = typeof req.body.metadata === 'string' 
                        ? JSON.parse(req.body.metadata) 
                        : req.body.metadata;
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid metadata format. Must be valid JSON.'
                    });
                }
            }

            const noteData = {
                userId,
                notesId: req.body.notesId ? parseInt(req.body.notesId) : null,
                courseId: parseInt(req.body.courseId),
                courseContentId: req.body.courseContentId ? parseInt(req.body.courseContentId) : null,
                noteContent: req.body.noteContent,
                noteRefTimestamp: req.body.noteRefTimestamp ? parseFloat(req.body.noteRefTimestamp) : null,
                metadata
            };

            const result = await NotesService.saveNoteWithFiles(noteData, files);

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('Save note with files error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to save note'
            });
        }
    }

    /**
     * Get a note with its file attachments
     * @swagger
     * /api/getNote/{id}:
     *   get:
     *     tags: [Notes]
     *     summary: Get a note with attachments
     *     description: Get a note by ID with file attachments and signed URLs
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Note ID
     *     responses:
     *       200:
     *         description: Note retrieved successfully
     *       404:
     *         description: Note not found
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    async getNoteWithFiles(req, res, next) {
        try {
            const noteId = parseInt(req.params.id);
            const userId = req.user.userId;

            if (!noteId || isNaN(noteId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid note ID is required'
                });
            }

            const result = await NotesService.getNoteWithFiles(noteId, userId);

            res.status(200).json({
                success: true,
                data: result.data
            });

        } catch (error) {
            logger.error('Get note with files error:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get note'
            });
        }
    }

    /**
     * Delete a note and its file attachments
     * @swagger
     * /api/deleteNote:
     *   post:
     *     tags: [Notes]
     *     summary: Delete a note with attachments
     *     description: Delete a note and all its file attachments
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               notesId:
     *                 type: integer
     *                 description: Note ID to delete
     *             required:
     *               - notesId
     *     responses:
     *       200:
     *         description: Note deleted successfully
     *       404:
     *         description: Note not found
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    async deleteNoteWithFiles(req, res, next) {
        try {
            const { notesId } = req.body;
            const userId = req.user.userId;

            if (!notesId) {
                return res.status(400).json({
                    success: false,
                    message: 'Note ID is required'
                });
            }

            const result = await NotesService.deleteNoteWithFiles(notesId, userId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: result.data
            });

        } catch (error) {
            logger.error('Delete note with files error:', error);
            
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message.includes('Unauthorized')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete note'
            });
        }
    }

    /**
     * Get user's notes for a course
     * @swagger
     * /api/getUserNotes:
     *   post:
     *     tags: [Notes]
     *     summary: Get user's notes for a course
     *     description: Get all notes for a user in a specific course with attachment info
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               courseId:
     *                 type: integer
     *                 description: Course ID
     *               courseContentId:
     *                 type: integer
     *                 description: Course content ID (optional)
     *               limit:
     *                 type: integer
     *                 default: 50
     *               offset:
     *                 type: integer
     *                 default: 0
     *             required:
     *               - courseId
     *     responses:
     *       200:
     *         description: Notes retrieved successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    async getUserNotesWithFiles(req, res, next) {
        try {
            const { courseId, courseContentId, limit = 50, offset = 0 } = req.body;
            const userId = req.user.userId;

            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required'
                });
            }

            const options = {
                limit: Math.min(parseInt(limit) || 50, 100), // Max 100 per request
                offset: parseInt(offset) || 0,
                courseContentId: courseContentId ? parseInt(courseContentId) : null
            };

            const result = await NotesService.getUserNotesWithFiles(userId, courseId, options);

            res.status(200).json({
                success: true,
                data: result.data
            });

        } catch (error) {
            logger.error('Get user notes with files error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get user notes'
            });
        }
    }

    // Legacy methods for backward compatibility
    async saveNote(req, res, next) {
        // Call the new method without files
        req.files = [];
        return this.saveNoteWithFiles(req, res, next);
    }

    async deleteNote(req, res, next) {
        return this.deleteNoteWithFiles(req, res, next);
    }
}

module.exports = new NotesController();