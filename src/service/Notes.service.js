const FileUploadService = require('./HybridFileUpload.service');
const db = require('../entity');
const logger = require('../config/winston.config');

class NotesService {
    /**
     * Save a note with optional file attachments
     * @param {Object} noteData - Note information
     * @param {number} noteData.userId - User ID
     * @param {number} noteData.notesId - Note ID for updates (optional)
     * @param {number} noteData.courseId - Course ID
     * @param {number} noteData.courseContentId - Course content ID
     * @param {string} noteData.noteContent - Note text content
     * @param {number} noteData.noteRefTimestamp - Reference timestamp
     * @param {Object} noteData.metadata - Additional metadata
     * @param {Array} files - Array of uploaded files (optional)
     * @returns {Promise<Object>} Save result with note info
     */
    async saveNoteWithFiles(noteData, files = []) {
        const transaction = await db.sequelize.transaction();
        
        try {
            const {
                userId,
                notesId,
                courseId,
                courseContentId,
                noteContent,
                noteRefTimestamp,
                metadata = {}
            } = noteData;

            // Input validation
            if (!userId) throw new Error('User ID is required');
            if (!courseId) throw new Error('Course ID is required');
            if (!notesId && !courseContentId) throw new Error('Course Content ID is required');
            if (!noteContent?.trim()) throw new Error('Notes text cannot be empty');

            let noteRecord;
            let fileAttachments = [];

            // Handle file uploads first if any files provided
            if (files && files.length > 0) {
                try {
                    logger.info(`Uploading ${files.length} files for note`);
                    const uploadResult = await FileUploadService.uploadMultipleFiles(
                        files,
                        userId,
                        'notes-attachments',
                        {
                            isPublic: false, // Notes attachments should be private
                            tags: ['note-attachment', `course-${courseId}`],
                            folder: `notes/${userId}/${courseId}`
                        }
                    );

                    logger.info('Upload result:', { 
                        success: uploadResult.success, 
                        uploadedCount: uploadResult.uploaded?.length || 0,
                        failedCount: uploadResult.failed?.length || 0
                    });

                    if (uploadResult.success && uploadResult.uploaded.length > 0) {
                        fileAttachments = uploadResult.uploaded.map(fileInfo => ({
                            fileId: fileInfo.id,
                            fileName: fileInfo.originalName,
                            fileUrl: fileInfo.fileUrl,
                            mimeType: fileInfo.mimeType,
                            fileSize: fileInfo.fileSize,
                            bucket: fileInfo.bucket,
                            filePath: fileInfo.filePath,
                            isPublic: fileInfo.isPublic,
                            uploadedAt: fileInfo.createdAt
                        }));
                        
                        logger.info(`Mapped ${fileAttachments.length} file attachments:`, fileAttachments);
                    }

                    // Log any failed uploads
                    if (uploadResult.failed.length > 0) {
                        logger.warn('Some file uploads failed for note:', uploadResult.failed);
                    }
                } catch (uploadError) {
                    logger.error('File upload error in saveNoteWithFiles:', uploadError);
                    // Continue with note saving even if file upload fails
                    throw new Error(`File upload failed: ${uploadError.message}`);
                }
            }

            // Prepare metadata with file attachments
            // Remove any existing file-related metadata to avoid conflicts
            const cleanMetadata = { ...metadata };
            delete cleanMetadata.attachments;
            delete cleanMetadata.hasAttachments;
            delete cleanMetadata.attachmentCount;
            delete cleanMetadata.hasFiles;
            delete cleanMetadata.totalFiles;
            delete cleanMetadata.hasAudio;
            
            const enrichedMetadata = {
                ...cleanMetadata, // Keep other metadata but exclude file-related fields
                attachments: fileAttachments,
                hasAttachments: fileAttachments.length > 0,
                attachmentCount: fileAttachments.length,
                // Derive file type information from attachments
                hasFiles: fileAttachments.length > 0,
                totalFiles: fileAttachments.length,
                hasAudio: fileAttachments.some(file => file.mimeType?.startsWith('audio/')),
                hasVideo: fileAttachments.some(file => file.mimeType?.startsWith('video/')),
                hasImages: fileAttachments.some(file => file.mimeType?.startsWith('image/')),
                hasDocuments: fileAttachments.some(file => 
                    file.mimeType?.includes('pdf') || 
                    file.mimeType?.includes('word') || 
                    file.mimeType?.includes('text') ||
                    file.mimeType?.includes('document')
                )
            };

            logger.info('Final enriched metadata:', enrichedMetadata);

            if (notesId) {
                // Update existing note
                noteRecord = await db.Notes.findByPk(notesId, { transaction });
                if (!noteRecord) throw new Error('Notes not found');

                // Verify ownership
                if (noteRecord.userId !== userId) {
                    throw new Error('Unauthorized to modify these notes');
                }

                // Merge existing attachments with new ones
                const existingAttachments = noteRecord.metadata?.attachments || [];
                const allAttachments = [...existingAttachments, ...fileAttachments];
                
                // Clean existing metadata of file-related fields
                const cleanExistingMetadata = { ...noteRecord.metadata };
                delete cleanExistingMetadata.attachments;
                delete cleanExistingMetadata.hasAttachments;
                delete cleanExistingMetadata.attachmentCount;
                delete cleanExistingMetadata.hasFiles;
                delete cleanExistingMetadata.totalFiles;
                delete cleanExistingMetadata.hasAudio;
                delete cleanExistingMetadata.hasVideo;
                delete cleanExistingMetadata.hasImages;
                delete cleanExistingMetadata.hasDocuments;
                
                noteRecord.noteContent = noteContent.trim();
                noteRecord.metadata = {
                    ...cleanExistingMetadata,
                    ...enrichedMetadata,
                    attachments: allAttachments,
                    hasAttachments: allAttachments.length > 0,
                    attachmentCount: allAttachments.length,
                    hasFiles: allAttachments.length > 0,
                    totalFiles: allAttachments.length,
                    hasAudio: allAttachments.some(file => file.mimeType?.startsWith('audio/')),
                    hasVideo: allAttachments.some(file => file.mimeType?.startsWith('video/')),
                    hasImages: allAttachments.some(file => file.mimeType?.startsWith('image/')),
                    hasDocuments: allAttachments.some(file => 
                        file.mimeType?.includes('pdf') || 
                        file.mimeType?.includes('word') || 
                        file.mimeType?.includes('text') ||
                        file.mimeType?.includes('document')
                    )
                };
                await noteRecord.save({ transaction });

            } else {
                // Create new note
                noteRecord = await db.Notes.create({
                    userId,
                    courseId,
                    courseContentId,
                    noteContent: noteContent.trim(),
                    noteRefTimestamp: noteRefTimestamp,
                    metadata: enrichedMetadata
                }, { transaction });
            }

            await transaction.commit();

            return {
                success: true,
                message: notesId ? 'Notes updated successfully' : 'Notes created successfully',
                data: {
                    noteId: noteRecord.noteId,
                    hasAttachments: noteRecord.metadata?.hasAttachments || false,
                    attachmentCount: noteRecord.metadata?.attachmentCount || 0,
                    attachments: noteRecord.metadata?.attachments || [],
                    metadata: noteRecord.metadata
                }
            };

        } catch (error) {
            await transaction.rollback();
            logger.error('Error in saveNoteWithFiles:', error);
            throw new Error(`Failed to save notes: ${error.message}`);
        }
    }

    /**
     * Get a note with its file attachments
     * @param {number} noteId - Note ID
     * @param {number} userId - User ID for authorization
     * @returns {Promise<Object>} Note with attachments
     */
    async getNoteWithFiles(noteId, userId) {
        try {
            const noteRecord = await db.Notes.findByPk(noteId, {
                include: [
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            if (!noteRecord) {
                throw new Error('Note not found');
            }

            // Verify ownership or access rights
            if (noteRecord.userId !== userId) {
                throw new Error('Unauthorized to access this note');
            }

            const noteData = noteRecord.toJSON();
            
            // Generate signed URLs for attachments if they exist
            if (noteData.metadata?.attachments?.length > 0) {
                const attachmentsWithSignedUrls = await Promise.all(
                    noteData.metadata.attachments.map(async (attachment) => {
                        try {
                            const signedUrlResult = await FileUploadService.generateSignedUrl(
                                attachment.fileId,
                                3600 // 1 hour expiry
                            );
                            return {
                                ...attachment,
                                signedUrl: signedUrlResult.url
                            };
                        } catch (error) {
                            logger.warn(`Failed to generate signed URL for file ${attachment.fileId}:`, error);
                            return attachment;
                        }
                    })
                );

                noteData.metadata.attachments = attachmentsWithSignedUrls;
            }

            return {
                success: true,
                data: noteData
            };

        } catch (error) {
            logger.error('Error in getNoteWithFiles:', error);
            throw new Error(`Failed to get note: ${error.message}`);
        }
    }

    /**
     * Delete a note and its file attachments
     * @param {number} noteId - Note ID
     * @param {number} userId - User ID for authorization
     * @returns {Promise<Object>} Deletion result
     */
    async deleteNoteWithFiles(noteId, userId) {
        const transaction = await db.sequelize.transaction();
        
        try {
            const noteRecord = await db.Notes.findByPk(noteId, { transaction });
            
            if (!noteRecord) {
                throw new Error('Note not found');
            }

            // Verify ownership
            if (noteRecord.userId !== userId) {
                throw new Error('Unauthorized to delete this note');
            }

            // Delete associated files
            const attachments = noteRecord.metadata?.attachments || [];
            const fileDeletionResults = [];
            
            for (const attachment of attachments) {
                try {
                    const deleteResult = await FileUploadService.deleteFile(attachment.fileId, userId);
                    fileDeletionResults.push({
                        fileId: attachment.fileId,
                        success: deleteResult.success
                    });
                } catch (error) {
                    logger.warn(`Failed to delete file ${attachment.fileId}:`, error);
                    fileDeletionResults.push({
                        fileId: attachment.fileId,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Delete the note
            await noteRecord.destroy({ transaction });
            
            await transaction.commit();

            return {
                success: true,
                message: 'Note and attachments deleted successfully',
                data: {
                    noteId: noteId,
                    filesDeleted: fileDeletionResults.filter(r => r.success).length,
                    fileErrors: fileDeletionResults.filter(r => !r.success).length,
                    fileDeletionDetails: fileDeletionResults
                }
            };

        } catch (error) {
            await transaction.rollback();
            logger.error('Error in deleteNoteWithFiles:', error);
            throw new Error(`Failed to delete note: ${error.message}`);
        }
    }

    /**
     * Get user's notes for a course with file attachment info
     * @param {number} userId - User ID
     * @param {number} courseId - Course ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} User's notes with attachment info
     */
    async getUserNotesWithFiles(userId, courseId, options = {}) {
        try {
            const { limit = 50, offset = 0, courseContentId } = options;

            const whereClause = { userId, courseId };
            if (courseContentId) {
                whereClause.courseContentId = courseContentId;
            }

            const notes = await db.Notes.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['note_created_at', 'DESC']],
                include: [
                    {
                        model: db.CourseContent,
                        as: 'courseContent',
                        attributes: ['courseContentId', 'courseContentTitle', 'courseContentType']
                    }
                ]
            });

            // Process notes to include attachment summary
            const processedNotes = notes.rows.map(note => {
                const noteData = note.toJSON();
                const attachments = noteData.metadata?.attachments || [];
                
                return {
                    ...noteData,
                    attachmentSummary: {
                        hasAttachments: attachments.length > 0,
                        attachmentCount: attachments.length,
                        attachmentTypes: [...new Set(attachments.map(a => a.mimeType?.split('/')[0]).filter(Boolean))]
                    }
                };
            });

            return {
                success: true,
                data: {
                    notes: processedNotes,
                    pagination: {
                        total: notes.count,
                        limit,
                        offset,
                        pages: Math.ceil(notes.count / limit)
                    }
                }
            };

        } catch (error) {
            logger.error('Error in getUserNotesWithFiles:', error);
            throw new Error(`Failed to get user notes: ${error.message}`);
        }
    }
}

module.exports = new NotesService();