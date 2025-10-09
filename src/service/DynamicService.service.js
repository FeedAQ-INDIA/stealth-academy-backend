const { Op, fn, col } = require("sequelize");
const db = require("../entity/index.js");
const lodash = require("lodash");
const logger = require("../config/winston.config.js");

async function deleteCourse(courseId, userId) {
  const t = await db.sequelize.transaction();

  try {
    // Delete course enrollments
    await db.UserCourseEnrollment.destroy({
      where: { courseId },
      transaction: t,
    });

    // Delete course content progress
    await db.UserCourseContentProgress.destroy({
      where: { courseId },
      transaction: t,
    });

    // Delete course access records
    await db.CourseAccess.destroy({
      where: { courseId },
      transaction: t,
    });

    // Delete course quizzes and results
    const quizzes = await db.CourseQuiz.findAll({
      where: { courseId },
      transaction: t,
    });

    for (const quiz of quizzes) {
      if (quiz.quizId) {
        await db.QuizResultLog.destroy({
          where: { quizId: quiz.quizId },
          transaction: t,
        });
        await db.QuizQuestion.destroy({
          where: { quizId: quiz.quizId },
          transaction: t,
        });
      }
    }
    await db.CourseQuiz.destroy({
      where: { courseId },
      transaction: t,
    });

    // Delete course flashcards
    await db.CourseFlashcard.destroy({
      where: { courseId },
      transaction: t,
    });

    // Delete course videos
    await db.CourseVideo.destroy({
      where: { courseId },
      transaction: t,
    });

    // Delete course written content
    await db.CourseWritten.destroy({
      where: { courseId },
      transaction: t,
    });

    // Delete course content
    await db.CourseContent.destroy({
      where: { courseId },
      transaction: t,
    });

    const courseObj = await db.Course.findByPk(courseId, { transaction: t });
    if (courseObj && courseObj.courseBuilderId) {
      const courseBuilderObj = await db.CourseBuilder.findByPk(
        courseObj.courseBuilderId,
        { transaction: t }
      );
      if (courseBuilderObj && courseBuilderObj.userId === userId) {
        courseBuilderObj.publishedCourseId = null;
        courseBuilderObj.status = 'DRAFT';
        await courseBuilderObj.save({ transaction: t });
      }
    }
    logger.info(`Course and related data deleted for courseId: ${courseId} by userId: ${userId}`);


    // Finally delete the course itself
    await db.Course.destroy({
      where: { courseId: courseId },
      transaction: t,
    });
 
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

function haveSameElements(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort((a, b) => a - b);
  const sorted2 = [...arr2].sort((a, b) => a - b);
  return sorted1.every((val, index) => val === sorted2[index]);
}

const searchRecord = async (req, res) => {
  try {
    const { limit, offset, getThisData } = req.body;

    // Prepare query options
    const queryOptions = {
      limit: limit || 10,
      offset: offset || 0,
      include: parseIncludes(getThisData)?.include,
      where: buildWhereClause(getThisData.where || {}),
      order: getThisData.order || [],
      ...(!lodash.isEmpty(getThisData.attributes) && {
        attributes: getThisData.attributes,
      }),
    };

    if (!lodash.isEmpty(getThisData.attributes)) {
      let a = [];
      getThisData.attributes.forEach((attr) => {
        // Check if attr is an array indicating a function
        if (
          Array.isArray(attr) &&
          attr.length === 2 &&
          attr[0] === "DISTINCT"
        ) {
          a.push([fn("DISTINCT", col(attr[1])), attr[1]]); // Handle the DISTINCT case
        }
      });
      console.log(a.length);
      if (a && !lodash.isEmpty(a)) {
        queryOptions.attributes = a;
        console.log("if", JSON.stringify(queryOptions));
      } else {
        console.log("elsse");
      }
    }

    console.log(JSON.stringify(queryOptions));

    // Fetch the data from the database
    const { count, rows } = await lodash
      .get(db, getThisData.datasource)
      .findAndCountAll({ ...queryOptions, distinct: true });
    console.log(rows);
    return {
      results: rows,
      totalCount: count,
      limit,
      offset,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

const buildWhereClause = (conditions) => {
  const where = {};

  for (const [key, value] of Object.entries(conditions)) {
    // Handle $and and $or at the top level
    if (key === "$and" || key === "$or") {
      where[Op[key.slice(1)]] = value.map((subCondition) =>
        buildWhereClause(subCondition)
      );
    }
    // Handle regular conditions
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      // Define operator mapping
      const operatorMapping = {
        $eq: Op.eq,
        $ne: Op.ne,
        $gt: Op.gt,
        $lt: Op.lt,
        $gte: Op.gte,
        $lte: Op.lte,
        $between: Op.between,
        $like: Op.like,
        $notLike: Op.notLike,
        $in: Op.in,
        $notIn: Op.notIn,
        $is: Op.is,
      };

      // Apply operator mapping for individual field conditions
      where[key] = Object.entries(value).reduce((acc, [op, val]) => {
        if (operatorMapping[op] !== undefined) {
          acc[operatorMapping[op]] = val;
        }
        return acc;
      }, {});
    } else {
      // Handle null and simple values for non-object types
      where[key] = value !== null ? value : { [Op.is]: null };
    }
  }

  return where;
};

const parseIncludes = (data) => {
  console.log(data);
  const { datasource, as, where, order, include, required, attributes } = data;
  console.log("key :: ", lodash.get(db, datasource), "::  req", required);

  let parsedInclude = {
    model: lodash.get(db, datasource),
    as: as,
    where: buildWhereClause(where || {}),
    order: order || [],
    required: required || false,
    ...(!lodash.isEmpty(attributes) && { attributes: attributes }),
  };

  if (!lodash.isEmpty(attributes)) {
    let a = [];
    attributes.forEach((attr) => {
      // Check if attr is an array indicating a function
      if (Array.isArray(attr) && attr.length === 2 && attr[0] === "DISTINCT") {
        a.push([fn("DISTINCT", col(attr[1])), attr[1]]); // Handle the DISTINCT case
      }
    });
    console.log(a.length);
    if (a && !lodash.isEmpty(a)) {
      parsedInclude.attributes = a;
    }
  }

  if (include && include.length) {
    parsedInclude.include = include.map((subInclude) =>
      parseIncludes(subInclude)
    );
  }

  return parsedInclude;
};

module.exports = {
  searchRecord,
  buildWhereClause,
  parseIncludes,
  haveSameElements,
  deleteCourse,
};
