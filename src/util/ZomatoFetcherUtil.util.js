const {default: axios} = require("axios");
const db = require("../entity/index.js");
const logger = require("../config/winston.config.js");
const xmService = require("../service/XmService.service.js");
const lodash = require("lodash");

const fetchDataFromZomato = async () => {
    console.log("Starting fetch");
    for (let i = 301; i < 302; i++) {
        await fetchAndStoreReviews(i);
    }
    //   fetchAndStoreReviews();
};

const fetchAndStoreReviews = async (page = 1) => {
    console.log(
        `https://www.zomato.com/webroutes/reviews/loadMore?sort=dd&filter=reviews-dd&res_id=51639&page=${page}`
    );
    const headers = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        // Add more headers if required
    };
    await axios
        .get(
            `https://www.zomato.com/webroutes/reviews/loadMore?sort=dd&filter=reviews-dd&res_id=51639&page=${page}`,
            {headers, withCredentials: true}
        )
        .then(async (res) => {
            console.log(`Fetched data for page ${page}`);
            await storeReviewData(res.data); // Call your function to store the review data
        })
        .catch((err) => {
            console.log(`Error fetching data for page ${page}:`, err);
        });
};

async function storeReviewData(response) {
    try {
        console.log("storing data");
        const reviews = response.page_data.sections.SECTION_REVIEWS.entities.find(
            (entity) => entity.entity_type === "REVIEWS"
        ).entity_ids;
        const reviewDetails = response.entities.REVIEWS;
        const ratingDetails = response.entities.RATING;

        for (let reviewId of reviews) {
            const review = reviewDetails[reviewId];

            // Step 2: Insert metadata for the review into RecordDataMetadata
            const metadata = [
                review.userName && {
                    queryName: "userName",
                    key: "User Name",
                    value: review.userName,
                },
                review.timestamp && {
                    queryName: "timestamp",
                    key: "Timestamp",
                    value: review.timestamp,
                },
                review.userFollowersCount && {
                    queryName: "userFollowersCount",
                    key: "User Followers",
                    value: review.userFollowersCount.toString(),
                },
                review.likeCount && {
                    queryName: "likeCount",
                    key: "Like Count",
                    value: review.likeCount.toString(),
                },
                review.ratingV2Text && {
                    queryName: "ratingText",
                    key: "Rating Text",
                    value: review.ratingV2Text,
                },
                review.experience && {
                    queryName: "experience",
                    key: "Experience",
                    value: review.experience,
                },
                review.userProfileUrl && {
                    queryName: "userProfileUrl",
                    key: "User Profile Url",
                    value: review.userProfileUrl,
                },
                review.reviewUrl && {
                    queryName: "reviewUrl",
                    key: "Review Url",
                    value: review.reviewUrl,
                },
                review.comments && {
                    queryName: "comments",
                    key: "Comments",
                    value: review.comments,
                },
                review.managementComments && {
                    queryName: "managementComments",
                    key: "Management Comments",
                    value: review.managementComments || '',
                },
            ].filter(Boolean); // Filters out `false` values


            // Step 3: If there are comments, add them as metadata
            review.comments.forEach((comment, index) => {
                metadata.push({
                    queryName: `comment_${index + 1}`,
                    key: `Comment ${index + 1}`,
                    value: comment.text || "",
                });
            });

            // Step 4: Add rating details (if available)
            const rating = review.rating.entities[0].entity_ids[0];
            if (ratingDetails[rating]) {
                const ratingData = ratingDetails[rating];
                metadata.push(
                    {
                        queryName: "ratingId",
                        key: "Rating ID",
                        value: ratingData.ratingId.toString(),
                    },
                    {
                        queryName: "ratingText",
                        key: "Rating Text",
                        value: ratingData.text,
                    },
                    {
                        queryName: "ratingValue",
                        key: "Rating Value",
                        value: ratingData.ratingV2,
                    },
                );
            }

            let recordData = [];
            if (!lodash.isEmpty(review?.reviewText)) {
                recordData.push({
                    key: "Zomato Reviews",
                    value: review.reviewText,
                    keyOptions: null,
                    keyInputType: "TEXT",
                    keyQuestionType: "REVIEW",
                    recordDataMetadata: metadata,
                });
            }
            if (!lodash.isEmpty(review?.ratingV2)) {
                recordData.push({
                    key: "Zomato Ratings",
                    value: review?.ratingV2,
                    keyOptions: [1, 2, 3, 4, 5],
                    keyInputType: "RATING",
                    keyQuestionType: "REVIEW",
                    recordDataMetadata: metadata,
                });
            }
            const subData = {
                workspaceId: 1,
                orgId: 1,
                recordSource: 'ZOMATO',
                reportedBy: {
                    firstName: review.userName,
                },
                submittedBy: {
                    firstName: review.userName,
                },
                submissionType: "REVIEW",
                ntfSessionId: 1,
                recordData: recordData,
            };
            xmService.submitRecord({body: subData});
        }

        console.log(
            "Data successfully stored in RecordData and RecordDataMetadata tables"
        );
    } catch (error) {
        console.error("Error storing review data:", error);
    }
}

module.exports = {fetchDataFromZomato};
