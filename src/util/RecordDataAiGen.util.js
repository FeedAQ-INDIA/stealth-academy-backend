const { default: axios } = require("axios");
const db = require("../entity/index.js");
const logger = require("../config/winston.config.js");

const triggerAiEngine = async (subData) => {
  console.log("Triggering AI Engine");
  console.log(subData);
  for (const element of subData) {
    if (
      element.keyInputType == "TEXT" 
    ) {
      const [
        sentimentDetectionResponse,
        entityExtractionResponse,
        summarizationEngineResponse,
      ] = await Promise.all([
        triggerSentimentDetection(element?.value, "eng", element?.recordDataId),
        triggerEntityExtraction(
          element?.value,
          ["ner", "pii"],
          "eng",
          element?.recordDataId
        ),
        triggerSummarizationEngine(
          element?.value,
          "eng",
          element?.value?.length,
          element?.recordDataId
        ),
      ]);

      await db.RecordDataMetadata.bulkCreate([
        ...sentimentDetectionResponse,
        ...entityExtractionResponse,
        ...summarizationEngineResponse,
      ]);
      console.log("Ai Trigger successfull ");
    }
  }
};

async function triggerSentimentDetection(inputText, inputLang, recordDataId) {
  let resData = await callSentimentDetection(inputText, inputLang);
  let recordDataMetaData = [];
  resData?.Sentiment.forEach((a) => {
    recordDataMetaData.push({
      recordDataId: recordDataId,
      queryName: "SENTIMENT",
      source: "KRUTRIM",
      category: "AI",
      key: a?.label,
      value: a?.value,
    });
  });

  return recordDataMetaData;
}

async function triggerSummarizationEngine(
  inputText,
  inputLang,
  summarySize,
  recordDataId
) {
  let resData = await callSummarizationEngine(
    inputText,
    inputLang,
    summarySize
  );
  let recordDataMetaData = [];
  if (resData != null) {
    recordDataMetaData.push({
      recordDataId: recordDataId,
      queryName: "SUMMARY",
      source: "KRUTRIM",
      category: "AI",
      key: "SUMMARY",
      value: resData?.data?.summaryText,
    });
  }

  return recordDataMetaData;
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
  let recordDataMetaData = [];
  resData?.data?.forEach((a) => {
    recordDataMetaData.push({
      recordDataId: recordDataId,
      queryName: "ENTITY-EXT",
      source: "KRUTRIM",
      category: "AI",
      key: a?.data[0]?.label,
      value: a?.data[0]?.value,
    });
  });
  return recordDataMetaData;
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

module.exports = { triggerAiEngine };
