const { default: axios } = require("axios");
const db = require("../entity/index.js");
const logger = require("../config/winston.config.js");
const triggerRecordAiEngine = async (subData, recordId) => {
  console.log("Triggering AI Engine for recordID :", recordId);
  console.log(subData.filter(a=> a.keyInputType == 'RATING')?.length);

  if(subData.filter(a=> a.keyInputType == 'TEXT')?.length == 0) {
    return;
  } 
  if(subData.filter(a=> a.keyInputType == 'RATING')?.length == subData.length && subData.length==1) {
    await db.RecordMetadata.create( {
      recordId: recordId,
      queryName: "SUMMARY",
      source: "INTRA_AI",
      category: "AI",
      key: "SUMMARY",
      value: "Got a Review Rating of "+subData.map(a=> subData.filter(a=> a.keyInputType == 'RATING')?.map(a=> a.value)[0])+" out of 5",
    })
  } 

  let modelledAiInpReq = subData.map((a) => ({
    question: a.key,
    answer: a.value,
    options: a.keyOptions,
    type: a.keyQuestionType,
  }));

  modelledAiInpReq = JSON.stringify(modelledAiInpReq);
  console.log("modelledAiInpReq :: ", modelledAiInpReq);

  let summaryGenRecordMetadata = await triggerSummarizationEngine(
    modelledAiInpReq,
    "eng",
    modelledAiInpReq?.length,
    recordId
  );
  let sentimentGenRecordMetadata = await triggerSentimentDetection(
    summaryGenRecordMetadata?.value,
    "eng",
    recordId
  );
  console.log("Sentiment Metadata: ", sentimentGenRecordMetadata);

  // Add summaryGenRecordMetadata to the sentimentGenRecordMetadata array
  sentimentGenRecordMetadata.push(summaryGenRecordMetadata);

  // Save the combined metadata array to the database
  let result = await db.RecordMetadata.bulkCreate(sentimentGenRecordMetadata);
  console.log("Bulk Insert Result:", result);
};


async function triggerSentimentDetection(inputText, inputLang, recordId) {
  let resData = await callSentimentDetection(inputText, inputLang);
  let recordMetadata = [];
  resData?.Sentiment.forEach((a) => {
    recordMetadata.push({
      recordId: recordId,
      queryName: "SENTIMENT",
      source: "KRUTRIM",
      category: "AI",
      key: a?.label,
      value: a?.value,
    });
  });

  return recordMetadata;
}

async function triggerSummarizationEngine(
  inputText,
  inputLang,
  summarySize,
  recordId
) {
  let resData = await callSummarizationEngine(
    inputText,
    inputLang,
    summarySize
  );
  let recordMetadata = {};
  if (resData != null) {
    recordMetadata = {
      recordId: recordId,
      queryName: "SUMMARY",
      source: "KRUTRIM",
      category: "AI",
      key: "SUMMARY",
      value: resData?.data?.summaryText,
    };
  }

  return recordMetadata;
}

async function triggerEntityExtraction(
  inputText,
  outputParamList,
  inputLang,
  recordDataId
) {
  let resData = await callEntityExtraction(
    inputText,
    outputParamList,
    inputLang
  );
  let recordMetadata = [];
  resData?.data?.forEach((a) => {
    recordMetadata.push({
      recordDataId: recordDataId,
      queryName: "ENTITY-EXT",
      source: "KRUTRIM",
      category: "AI",
      key: a?.data[0]?.label,
      value: a?.data[0]?.value,
    });
  });
  return recordMetadata;
}

async function callSentimentDetection(inputText, inputLang) {
  let resData;
  await axios
    .post(
      "https://cloud.olakrutrim.com/api/v1/languagelabs/sentiment-analysis/",
      {
        text: inputText,
        lang_from: inputLang,
      },
      {
        headers: {
          Authorization: "Bearer xm-R4gvaCRB35gW4ncBSG8ybjGV7HoR", // Corrected placement of Authorization header
        },
      }
    )
    .then((res) => {
      console.log(res.data);
      resData = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return resData;
}

async function callLanguageDetection(inputText) {
  let resData;
  axios
    .post(
      "https://cloud.olakrutrim.com/api/v1/languagelabs/language-detection",
      {
        query: inputText,
      },
      {
        headers: {
          Authorization: "Bearer xm-R4gvaCRB35gW4ncBSG8ybjGV7HoR", // Corrected placement of Authorization header
        },
      }
    )
    .then((res) => {
      console.log(res.data);
      resData = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return resData;
}

async function callLanguageTranslation(inputText, inputLang, outputLang) {
  let resData;
  axios
    .post(
      "https://cloud.olakrutrim.com/api/v1/languagelabs/translation",
      {
        text: inputText,
        src_language: inputLang,
        tgt_language: outputLang,
        model: "krutrim-translate-v1.0",
      },
      {
        headers: {
          Authorization: "Bearer xm-R4gvaCRB35gW4ncBSG8ybjGV7HoR", // Corrected placement of Authorization header
        },
      }
    )
    .then((res) => {
      console.log(res.data);
      resData = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return resData;
}

async function callSummarizationEngine(inputText, inputLang, summarySize) {
  let resData;
  await axios
    .post(
      "https://cloud.olakrutrim.com/api/v1/languagelabs/summarization",
      {
        text: inputText,
        input_language: inputLang,
      },
      {
        headers: {
          Authorization: "Bearer xm-R4gvaCRB35gW4ncBSG8ybjGV7HoR", // Corrected placement of Authorization header
        },
      }
    )
    .then((res) => {
      console.log(res.data);
      resData = res.data;
    })
    .catch((err) => {
      console.log(err.msg);
    });
  return resData;
}

async function callEntityExtraction(inputText, outputParamList, inputLang) {
  let resData;
  await axios
    .post(
      "https://cloud.olakrutrim.com/api/v1/languagelabs/entity-extraction",
      {
        text: inputText,
        param_list: ["ner", "pii"],
        lang_from: inputLang,
      },
      {
        headers: {
          Authorization: "Bearer xm-R4gvaCRB35gW4ncBSG8ybjGV7HoR", // Corrected placement of Authorization header
        },
      }
    )
    .then((res) => {
      console.log(res.data);
      resData = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return resData;
}

module.exports = { triggerRecordAiEngine };
