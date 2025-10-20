const NotesService = require('../service/Notes.service');
const { validationResult } = require('express-validator');
const logger = require('../config/winston.config');
const { ApiResponse } = require('../utils/responseFormatter');

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
        const apiResponse = new ApiResponse(req, res);
        
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse
                    .status(400)
                    .withMessage('Validation errors')
                    .withError('Validation failed', 'VALIDATION_ERROR', 'saveNoteWithFiles', { errors: errors.array() })
                    .error();
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
                    return apiResponse
                        .status(400)
                        .withMessage('Invalid metadata format')
                        .withError('Invalid metadata format. Must be valid JSON.', 'INVALID_METADATA', 'saveNoteWithFiles')
                        .error();
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

            apiResponse
                .status(200)
                .withMessage(result.message)
                .withData(result.data)
                .withMeta({
                    userId,
                    courseId: noteData.courseId,
                    notesId: noteData.notesId,
                    hasFiles: files.length > 0,
                    filesCount: files.length
                })
                .success();

        } catch (error) {
            logger.error('Save note with files error:', error);
            apiResponse
                .status(500)
                .withMessage(error.message || 'Failed to save note')
                .withError(error, 'SAVE_NOTE_ERROR', 'saveNoteWithFiles')
                .withMeta({
                    userId: req.user?.userId,
                    courseId: req.body.courseId
                })
                .error();
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
        const apiResponse = new ApiResponse(req, res);
        
        try {
            const noteId = parseInt(req.params.id);
            const userId = req.user.userId;

            if (!noteId || isNaN(noteId)) {
                return apiResponse
                    .status(400)
                    .withMessage('Valid note ID is required')
                    .withError('Valid note ID is required', 'INVALID_NOTE_ID', 'getNoteWithFiles')
                    .error();
            }

            const result = await NotesService.getNoteWithFiles(noteId, userId);

            apiResponse
                .status(200)
                .withMessage('Note retrieved successfully')
                .withData(result.data)
                .withMeta({
                    noteId,
                    userId
                })
                .success();

        } catch (error) {
            logger.error('Get note with files error:', error);
            
            const errorMessage = error.message?.toLowerCase() || '';
            const status = errorMessage.includes('not found') ? 404 :
                          errorMessage.includes('unauthorized') ? 403 : 500;
            
            apiResponse
                .status(status)
                .withMessage(error.message || 'Failed to get note')
                .withError(error, status === 404 ? 'NOTE_NOT_FOUND' : 
                                  status === 403 ? 'UNAUTHORIZED_ACCESS' : 'GET_NOTE_ERROR', 
                          'getNoteWithFiles')
                .withMeta({
                    noteId: req.params.id,
                    userId: req.user?.userId
                })
                .error();
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
        const apiResponse = new ApiResponse(req, res);
        
        try {
            const { notesId } = req.body;
            const userId = req.user.userId;

            if (!notesId) {
                return apiResponse
                    .status(400)
                    .withMessage('Note ID is required')
                    .withError('Note ID is required', 'MISSING_FIELD', 'deleteNoteWithFiles')
                    .error();
            }

            const result = await NotesService.deleteNoteWithFiles(notesId, userId);

            apiResponse
                .status(200)
                .withMessage(result.message)
                .withData(result.data)
                .withMeta({
                    notesId,
                    userId,
                    deletedAt: new Date().toISOString()
                })
                .success();

        } catch (error) {
            logger.error('Delete note with files error:', error);
            
            const errorMessage = error.message?.toLowerCase() || '';
            const status = errorMessage.includes('not found') ? 404 :
                          errorMessage.includes('unauthorized') ? 403 : 500;
            
            apiResponse
                .status(status)
                .withMessage(error.message || 'Failed to delete note')
                .withError(error, status === 404 ? 'NOTE_NOT_FOUND' : 
                                  status === 403 ? 'UNAUTHORIZED_ACCESS' : 'DELETE_NOTE_ERROR', 
                          'deleteNoteWithFiles')
                .withMeta({
                    notesId: req.body.notesId,
                    userId: req.user?.userId
                })
                .error();
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
        const apiResponse = new ApiResponse(req, res);
        
        try {
            const { courseId, courseContentId, limit = 50, offset = 0 } = req.body;
            const userId = req.user.userId;

            if (!courseId) {
                return apiResponse
                    .status(400)
                    .withMessage('Course ID is required')
                    .withError('Course ID is required', 'MISSING_FIELD', 'getUserNotesWithFiles')
                    .error();
            }

            const options = {
                limit: Math.min(parseInt(limit) || 50, 100), // Max 100 per request
                offset: parseInt(offset) || 0,
                courseContentId: courseContentId ? parseInt(courseContentId) : null
            };

            const result = await NotesService.getUserNotesWithFiles(userId, courseId, options);

            apiResponse
                .status(200)
                .withMessage('User notes retrieved successfully')
                .withData(result.data)
                .withMeta({
                    userId,
                    courseId,
                    courseContentId: options.courseContentId,
                    limit: options.limit,
                    offset: options.offset,
                    totalNotes: result.data?.notes?.length || 0
                })
                .success();

        } catch (error) {
            logger.error('Get user notes with files error:', error);
            apiResponse
                .status(500)
                .withMessage(error.message || 'Failed to get user notes')
                .withError(error, 'GET_USER_NOTES_ERROR', 'getUserNotesWithFiles')
                .withMeta({
                    userId: req.user?.userId,
                    courseId: req.body.courseId
                })
                .error();
        }
    }

    // Enhanced saveNote method - supports creation and updation with files
    async saveNote(req, res, next) {
        const apiResponse = new ApiResponse(req, res);
        
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse
                    .status(400)
                    .withMessage('Validation errors')
                    .withError('Validation failed', 'VALIDATION_ERROR', 'saveNote', { errors: errors.array() })
                    .error();
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
                    return apiResponse
                        .status(400)
                        .withMessage('Invalid metadata format')
                        .withError('Invalid metadata format. Must be valid JSON.', 'INVALID_METADATA', 'saveNote')
                        .error();
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

            apiResponse
                .status(200)
                .withMessage(result.message)
                .withData(result.data)
                .withMeta({
                    userId,
                    courseId: noteData.courseId,
                    notesId: noteData.notesId,
                    isUpdate: !!noteData.notesId,
                    hasFiles: files.length > 0
                })
                .success();

        } catch (error) {
            logger.error('Save note error:', error);
            apiResponse
                .status(500)
                .withMessage(error.message || 'Failed to save note')
                .withError(error, 'SAVE_NOTE_ERROR', 'saveNote')
                .withMeta({
                    userId: req.user?.userId,
                    courseId: req.body.courseId
                })
                .error();
        }
    }

    // Enhanced deleteNote method - deletes note and associated files from storage
    async deleteNote(req, res, next) {
        const apiResponse = new ApiResponse(req, res);
        
        try {
            const { notesId } = req.body;
            const userId = req.user.userId;

            if (!notesId) {
                return apiResponse
                    .status(400)
                    .withMessage('Note ID is required')
                    .withError('Note ID is required', 'MISSING_FIELD', 'deleteNote')
                    .error();
            }

            const result = await NotesService.deleteNoteWithFiles(notesId, userId);

            apiResponse
                .status(200)
                .withMessage(result.message)
                .withData(result.data)
                .withMeta({
                    notesId,
                    userId,
                    deletedAt: new Date().toISOString()
                })
                .success();

        } catch (error) {
            logger.error('Delete note error:', error);
            
            const errorMessage = error.message?.toLowerCase() || '';
            const status = errorMessage.includes('not found') ? 404 :
                          errorMessage.includes('unauthorized') ? 403 : 500;
            
            apiResponse
                .status(status)
                .withMessage(error.message || 'Failed to delete note')
                .withError(error, status === 404 ? 'NOTE_NOT_FOUND' : 
                                  status === 403 ? 'UNAUTHORIZED_ACCESS' : 'DELETE_NOTE_ERROR', 
                          'deleteNote')
                .withMeta({
                    notesId: req.body.notesId,
                    userId: req.user?.userId
                })
                .error();
        }
    }

}

module.exports = new NotesController();