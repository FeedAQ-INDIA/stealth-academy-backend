const jwt = require("jsonwebtoken");
const lodash = require("lodash");
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const logger = require("../config/winston.config");
const AcademyService = require("../service/AcademyService.service.js");


async function getUser(req, res, next) {
    const {} = req.body;
    try {
        let val = await AcademyService.getUser(req.user.userId);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occured`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
    
}  
async function saveWritingSubmission(req, res) {
    try {
        const { userId, promptId, submissionText } = req.body;
        console.log('Controller received:', { userId, promptId, submissionText }); // Debug log
        if (!userId || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        const response = await AcademyService.saveWritingSubmission(userId, promptId, submissionText);
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getWritingSubmission(req, res) {
    try {
        const { userId, submissionId } = req.body;
        console.log('Controller received:', { userId, submissionId }); // Debug log
        if (!userId || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        if (!submissionId || !Number.isInteger(submissionId)) {
            return res.status(400).json({ message: 'Invalid or missing submissionId' });
        }
        const response = await AcademyService.getWritingSubmission(userId, submissionId);
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: error.message });
    }
}
// async function dynamicApi(req, res) {
//     try {
//         const { entity, operation } = req.params;
//         const { id } = req.query;
//         const data = req.body;
        
//         const result = await AcademyService.dynamicApiHandler(
//             entity, 
//             operation, 
//             data, 
//             id
//         );

//         res.status(200).json({
//             status: 200,
//             message: "Success",
//             data: result
//         });
//     } catch (error) {
//         logger.error(error);
//         res.status(500).json({ 
//             status: 500,
//             message: error.message 
//         });
//     }
// } 

async function searchRecord(req, res, next) {
    const {
        searchValue, searchKey, attributes, limit, offset, sortBy, sortOrder, filters, associate,
    } = req.body;
    try {
        let val = await AcademyService.searchRecord(req, res);
        res.status(200).send({
            status: 200, message: "Success", data: val != null ? val : [],
        });
    } catch (err) {
        console.error(`Error occurred`, err.message);
        res.status(500).send({
            status: 500, message: err.message || "Some error occurred while creating the Tutorial.",
        });
        next(err);
    }
} 


// test forntend data is coming or not or not 

async function processWritingConfig(req, res) {
  try {
    const {  level, topicSource, customTopic, writingStyle } = req.body;
    
    console.log("Received config:", { level, topicSource, customTopic, writingStyle });
    // Validate required fields
    if ( !level || !topicSource || !writingStyle) {
      return res.status(400).json({ 
        status: 400, 
        message: "Missing required fields" 
      });
    }
    
    // Process the configuration (without saving to database)
    const generatedPrompt = AcademyService.generateWritingPrompt({
      
      level,
      topicSource,
      customTopic,
      writingStyle
    });
    
    res.status(200).json({
      status: 200,
      message: "Configuration processed successfully",
      data: {
        prompt: generatedPrompt
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ 
      status: 500,
      message: error.message 
    });
  }
} 

async function getWritingPrompts(req, res) {
    try {
        // Options for pagination and filtering can be passed in the request body
        const options = req.body;
        const response = await AcademyService.getWritingPrompts(options);
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error('Controller error:', error.message);
        res.status(500).json({ message: 'Failed to fetch writing prompts.' });
    }
}


// save writing promt 
async function saveWritingPrompt(req, res) {
    try {
        const promptData = req.body;
        const newPrompt = await AcademyService.saveWritingPrompt(promptData);
        res.status(201).json({ status: 201, message: "Writing prompt created successfully", data: newPrompt });
    } catch (error) {
        logger.error('Controller error:', error.message);
        // Send a 400 Bad Request for validation errors, and 500 for other errors.
        if (error.message.includes("Missing required fields")) {
            return res.status(400).json({ status: 400, message: error.message });
        }
        res.status(500).json({ message: 'Failed to save writing prompt.' });
    }
} 


// resfresh qustion 
async function getNextWritingPrompt(req, res) {
    try {
        const { userId, Id, level, name } = req.body;
        
        if (!userId || !Id || !level || !name) {
            return res.status(400).json({ message: 'Missing required fields: userId, currentPromptId, level, and name.' });
        }

        const nextPrompt = await AcademyService.getNextWritingPrompt(userId, Id, level, name);

        if (!nextPrompt) {
            return res.status(404).json({ message: 'No more prompts available in this category.' });
        }

        res.status(200).json({ status: 200, message: "Success", data: nextPrompt });
    } catch (error) {
        logger.error('Controller error:', error.message);
        res.status(500).json({ message: 'Failed to fetch the next writing prompt.' });
    }
}

// save writing submission
// Generic.controller.js
async function saveWritingSubmission(req, res) {
    try {
        const { 
            userId, 
            promptId, 
            responseText,
            typingSpeed,       // New field
            totalTime,         // New field
            editHistory,       // New field
            lexicalDiversity,  // New field
            wordCount,         // New field
            avgSentenceLength, // New field
            questionThinkingTime, // New field
            answerThinkingTime // New field
        } = req.body;

        console.log('Controller received:', { 
            userId, promptId, responseText, typingSpeed, totalTime, editHistory, 
            lexicalDiversity, wordCount, avgSentenceLength, questionThinkingTime, 
            answerThinkingTime 
        }); // Debug log

        if (!userId || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        // Basic validation for promptId and responseText (as before)
        if (!promptId || !Number.isInteger(promptId)) {
            return res.status(400).json({ message: 'Invalid or missing promptId' });
        }
        if (!responseText || typeof responseText !== 'string') {
            return res.status(400).json({ message: 'responseText is required and must be a string' });
        }

        const response = await AcademyService.saveWritingSubmission(
            userId, 
            promptId, 
            responseText,
            typingSpeed,
            totalTime,
            editHistory,
            lexicalDiversity,
            wordCount,
            avgSentenceLength,
            questionThinkingTime,
            answerThinkingTime
        ); 

        const respons= await AcademyService.analyzeWritingWithPythonAPI(responseText, response.submissionId,typingSpeed, totalTime, editHistory, lexicalDiversity, wordCount, avgSentenceLength, questionThinkingTime, answerThinkingTime);
        res.status(200).json({ status: 200, message: "Success", data: response, analysis: respons});
    } catch (error) {
        logger.error('Controller error:', error.message); // Use error.message for logging
        res.status(500).json({ message: error.message });
    }
} 



// --- New function to save ReadingTopic ---
async function saveReadingTopic(req, res) {
    try {
        const { level, topicType,  contentText,  createdByUserId } = req.body;
        const topicData = { level, topicType,  contentText,  createdByUserId };

        const newTopic = await AcademyService.saveReadingTopic(topicData);
        res.status(201).json({ 
            status: 201, 
            message: "Reading topic saved successfully", 
            data: newTopic 
        });
    } catch (error) {
        logger.error('Controller error while saving reading topic:', error.message);
        // Provide specific error messages for validation errors
        if (error.message.includes("Missing required fields") || error.message.includes("Invalid level") || error.message.includes("Invalid topicType")) {
            return res.status(400).json({ status: 400, message: error.message });
        }
        res.status(500).json({ message: 'Failed to save reading topic.' });
    }
}

// get reading topic
// This function retrieves a reading topic based on the provided options
async function getReadingTopic(req, res) {
    try {
        // Options for filtering can be passed in the request body
        const options = req.body;
        // The service layer will validate if userId is present
        const response = await AcademyService.getReadingTopic(options);
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error('Controller error while fetching reading topic:', error.message);
        if (error.message.includes("User ID is required")) {
            return res.status(400).json({ status: 400, message: error.message });
        }
        res.status(500).json({ message: 'Failed to fetch reading topic.' });
    }
}

// get next reading topic
async function getNextReadingTopic(req, res) {
    try {
        const { userId, Id, level, topicType } = req.body;
        
        if (!userId || !Id || !level || !topicType) {
            return res.status(400).json({ message: 'Missing required fields: userId, currentTopicId, level, and topicType.' });
        }

        const nextTopic = await AcademyService.getNextReadingTopic(userId, Id, level, topicType);

        if (!nextTopic) {
            return res.status(404).json({ message: 'No more reading topics available in this category.' });
        }

        res.status(200).json({ status: 200, message: "Success", data: nextTopic });
    } catch (error) {
        logger.error('Controller error while fetching the next reading topic:', error.message);
        res.status(500).json({ message: 'Failed to fetch the next reading topic.' });
    }
}


// upload reading audio file to supabase 
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for direct upload

async function uploadAudio(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        
        const userId=1
        const topicId=100
            // audioUrl,
            
            
        
        // This assumes you have a user ID from your authentication middleware
        // const userId = '2'; // Example: get userId from auth token\
        // suppabase
        const audioUrl = await AcademyService.uploadAudioFile(req.file, userId);
        const audioUrls = audioUrl.url;
        console.log(audioUrls);
        //save data base 
        const parsedUserId = parseInt(userId, 10);
        if (!userId || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        const parsedTopicId = parseInt(userId, 10);
        if (!topicId  || !Number.isInteger(topicId)) {
            return res.status(400).json({ message: 'Invalid or missing topicId' });
        }
        if (!audioUrls|| typeof audioUrls !== 'string') {
            return res.status(400).json({ message: 'audioUrl is required and must be a string' });
        }

        const response = await AcademyService.saveReadingSubmission(
            userId,
            topicId,
            audioUrls,
            
        );
        // res.status(200).json({ status: 200, message: "Success", data: response });
        // ai  
        const submissionId= response.submissionId; // Assuming the response contains the submission ID
        const analysisResult = await AcademyService.analyzeReadingWithPythonAPI(req.file,submissionId);

        // report genaration method 
        
        res.status(200).json({ 
            status: 200, 
            message: "Audio uploaded successfully", 
            data: { audioUrl , analysisResult,response } 
        });
    } catch (error) {
        logger.error('Controller error while uploading audio:', error.message);
        res.status(500).json({ message: error.message });
    }
}

// --- New function to save ReadingSubmission ---
async function saveReadingSubmission(req, res) {
    try {
        const {
            userId,
            topicId,
            audioUrl,
            recordingDuration,
            attemptsCount,
            selfConfidence,
            noiseLevel,
            deviceInfo,
            practiceTime,
            modelPlays,
            userNotes
        } = req.body;

        console.log('Controller received reading submission:', {
            userId, topicId, audioUrl, recordingDuration, attemptsCount,
            selfConfidence, noiseLevel, deviceInfo, practiceTime, modelPlays, userNotes
        });

        if (!userId || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        if (!topicId || !Number.isInteger(topicId)) {
            return res.status(400).json({ message: 'Invalid or missing topicId' });
        }
        if (!audioUrl || typeof audioUrl !== 'string') {
            return res.status(400).json({ message: 'audioUrl is required and must be a string' });
        }

        const response = await AcademyService.saveReadingSubmission(
            userId,
            topicId,
            audioUrl,
            recordingDuration,
            attemptsCount,
            selfConfidence,
            noiseLevel,
            deviceInfo,
            practiceTime,
            modelPlays,
            userNotes
        );
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error('Controller error while saving reading submission:', error.message);
        res.status(500).json({ message: error.message });
    }
}


// speaking topic save 
async function saveSpeakingTopic(req, res) {
    try {
        const { level, topicType, promptText, createdByUserId } = req.body;
        const topicData = { level, topicType, promptText, createdByUserId };

        const newTopic = await AcademyService.saveSpeakingTopic(topicData);
        res.status(201).json({ 
            status: 201, 
            message: "Speaking topic saved successfully", 
            data: newTopic 
        });
    } catch (error) {
        logger.error('Controller error while saving speaking topic:', error.message);
        // Provide specific error messages for validation errors
        if (error.message.includes("Missing required fields") || error.message.includes("Invalid level") || error.message.includes("Invalid topicType")) {
            return res.status(400).json({ status: 400, message: error.message });
        }
        res.status(500).json({ message: 'Failed to save speaking topic.' });
    }
}

// get speaking topic
async function getSpeakingTopic(req, res) {
    try {
        const options = req.body;
        const response = await AcademyService.getSpeakingTopic(options);
        res.status(200).json({ status: 200, message: "Success", data: response });
    } catch (error) {
        logger.error('Controller error while fetching speaking topic:', error.message);
        if (error.message.includes("User ID is required")) {
            return res.status(400).json({ status: 400, message: error.message });
        }
        res.status(500).json({ message: 'Failed to fetch speaking topic.' });
    }
}


// get next speaking topic
async function getNextSpeakingTopic(req, res) {
    try {
        const { userId, Id, level, topicType } = req.body;
        
        if (!userId || !Id || !level || !topicType) {
            return res.status(400).json({ message: 'Missing required fields: userId, currentTopicId, level, and topicType.' });
        }

        const nextTopic = await AcademyService.getNextSpeakingTopic(userId, Id, level, topicType);

        if (!nextTopic) {
            return res.status(404).json({ message: 'No more speaking topics available in this category.' });
        }

        res.status(200).json({ status: 200, message: "Success", data: nextTopic });
    } catch (error) {
        logger.error('Controller error while fetching the next speaking topic:', error.message);
        res.status(500).json({ message: 'Failed to fetch the next speaking topic.' });
    }
}


// upload speaking audio file to supabase
async function uploadSpeakingAudioFile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        
        // This assumes you have a user ID from your authentication middleware
        const userId=1
        const topicId=100 // Example: get userId from auth token
        const audioUrl = await AcademyService.uploadSpeakingAudioFile(req.file, userId);
        const audioUrls = audioUrl.url;
        const response = await AcademyService.saveSpeakingSubmission(
            userId,
            topicId,
            audioUrls,
            
        );
        const submissionId= response.submissionId; // Assuming the response contains the submission ID
        console.log('Controller received submissionId:', submissionId); // Debug log
        const analysisResult = await AcademyService.analyzeSpeakingWithPythonAPI(req.file,submissionId);

        res.status(200).json({ 
            status: 200, 
            message: "Audio uploaded successfully", 
            data: { audioUrl , analysisResult,response } 
        });
    } catch (error) {
        logger.error('Controller error while uploading audio:', error.message);
        res.status(500).json({ message: error.message });
    }
}


// the is for speaking 
// async function uploadAudio(req, res) {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: 'No file uploaded.' });
//         }
        
//         const userId=1
//         const topicId=100
//             // audioUrl,
            
            
        
//         // This assumes you have a user ID from your authentication middleware
//         // const userId = '2'; // Example: get userId from auth token\
//         // suppabase
//         const audioUrl = await AcademyService.uploadAudioFile(req.file, userId);
//         const audioUrls = audioUrl.url;
//         console.log(audioUrls);
//         //save data base 
//         const parsedUserId = parseInt(userId, 10);
//         if (!userId || !Number.isInteger(userId)) {
//             return res.status(400).json({ message: 'Invalid or missing userId' });
//         }
//         const parsedTopicId = parseInt(userId, 10);
//         if (!topicId  || !Number.isInteger(topicId)) {
//             return res.status(400).json({ message: 'Invalid or missing topicId' });
//         }
//         if (!audioUrls|| typeof audioUrls !== 'string') {
//             return res.status(400).json({ message: 'audioUrl is required and must be a string' });
//         }

        // const response = await AcademyService.saveReadingSubmission(
        //     userId,
        //     topicId,
        //     audioUrls,
            
        // );
//         // res.status(200).json({ status: 200, message: "Success", data: response });
//         // ai  
        // const submissionId= response.submissionId; // Assuming the response contains the submission ID
        // const analysisResult = await AcademyService.analyzeAudioWithPythonAPI(req.file,submissionId);

//         // report genaration method 
        
//         res.status(200).json({ 
//             status: 200, 
//             message: "Audio uploaded successfully", 
            // data: { audioUrl , analysisResult,response } 
//         });
//     } catch (error) {
//         logger.error('Controller error while uploading audio:', error.message);
//         res.status(500).json({ message: error.message });
//     }
// }
async function getGeminiResponse(req, res) {
    const { query, level, category } = req.body;

    // Validate the request body
    if (!level || !category) {
        return res.status(400).json({ message: 'Level and category are required.' });
    }

    try {
        const result = await AcademyService.callGeminiAPI(query, level, category);
        
        if (result.success) {
            res.status(200).json({ status: 200, message: "Success", data: result.data });
        } else {
            res.status(500).json({ status: 500, message: "Error from Gemini API", data: result.error });
        }

    } catch (error) {
        logger.error('Controller error while calling Gemini API:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
} 

// save topic select
async function saveTopicSelect(req, res) {
  try {
    const { level, type, promptText, query, isAutoGenerated, createdByUserId } = req.body;

    if (!level || !type || !promptText) {
      return res.status(400).json({ status: 400, message: "Missing required fields: level, type, promptText" });
    }

    const topicData = { level, type, promptText, query, isAutoGenerated, createdByUserId };

    const newTopic = await AcademyService.saveTopicSelect(topicData);

    res.status(201).json({
      status: 201,
      message: "TopicSelect saved successfully",
      data: newTopic,
    });
  } catch (error) {
    logger.error("Controller error while saving TopicSelect data:", error.message);
    res.status(500).json({ message: "Failed to save TopicSelect." });
  }
}
module.exports = {
    getUser,

    searchRecord,
    processWritingConfig,
    getWritingPrompts,
    saveWritingPrompt,
    getNextWritingPrompt,
    saveWritingSubmission,
    saveReadingTopic,
    getReadingTopic,
    getNextReadingTopic,
    uploadAudio,
    upload,
    saveReadingSubmission,
    saveSpeakingTopic,
    getNextSpeakingTopic,
    getSpeakingTopic,
    uploadSpeakingAudioFile,
    getGeminiResponse,
    saveTopicSelect
};

