const validate = (method) => {
  return async (req, res, next) => {
    try {
      if (method === 'saveWritingSubmission') {
        const { promptId, submissionText } = req.body;
        if (!promptId || !Number.isInteger(promptId)) {
          return res.status(400).json({ message: 'Invalid or missing promptId' });
        }
        if (submissionText && typeof submissionText !== 'string') {
          return res.status(400).json({ message: 'Invalid submissionText' });
        }
      } else if (method === 'getWritingSubmission') {
        const { submissionId } = req.body;
        if (!submissionId || !Number.isInteger(submissionId)) {
          return res.status(400).json({ message: 'Invalid or missing submissionId' });
        }
      }
      next();
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  };
};

module.exports = { validate };