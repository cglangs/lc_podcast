var DataTypes = require("sequelize").DataTypes;
var _intervals = require("./intervals");
var _phrase_contains_words = require("./phrase_contains_words");
var _phrase_teaches_words = require("./phrase_teaches_words");
var _phrases = require("./phrases");
var _user_progress = require("./user_progress");
var _users = require("./users");
var _words = require("./words");

function initModels(sequelize) {
  var intervals = _intervals(sequelize, DataTypes);
  var phrase_contains_words = _phrase_contains_words(sequelize, DataTypes);
  var phrase_teaches_words = _phrase_teaches_words(sequelize, DataTypes);
  var phrases = _phrases(sequelize, DataTypes);
  var user_progress = _user_progress(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var words = _words(sequelize, DataTypes);

  phrase_contains_words.belongsTo(phrases, { foreignKey: "phrase_id"});
  words.belongsToMany(phrases, { through: phrase_contains_words, foreignKey: "word_id", otherKey: "phrase_id" });
  phrases.hasMany(phrase_contains_words, { foreignKey: "phrase_id"});
  phrase_contains_words.belongsTo(words, { foreignKey: "word_id"});
  //phrases.belongsToMany(words, { through: phrase_contains_words, foreignKey: "phrase_id", otherKey: "word_id" });
  //words.hasMany(phrase_contains_words, { foreignKey: "word_id"});
  phrase_teaches_words.belongsTo(phrases, { foreignKey: "phrase_id"});
  words.belongsToMany(phrases, { through: phrase_teaches_words, foreignKey: "word_id", otherKey: "phrase_id" });
  phrases.hasMany(phrase_teaches_words, { foreignKey: "phrase_id"});
  phrase_teaches_words.belongsTo(words, { foreignKey: "word_id"});
  //phrases.belongsToMany(words, { through: phrase_teaches_words, foreignKey: "phrase_id", otherKey: "word_id" });
  //words.hasMany(phrase_teaches_words, { foreignKey: "word_id"});
  user_progress.belongsTo(intervals, { foreignKey: "interval_id"});
  intervals.hasMany(user_progress, { foreignKey: "interval_id"});
  user_progress.belongsTo(users, { foreignKey: "user_id"});
  words.belongsToMany(users, { through: user_progress, foreignKey: "word_id", otherKey: "user_id" });
  users.hasMany(user_progress, { foreignKey: "user_id"});
  user_progress.belongsTo(words, { foreignKey: "word_id"});
  users.belongsToMany(words, { through: user_progress, foreignKey: "user_id", otherKey: "word_id" });
  words.hasMany(user_progress, { foreignKey: "word_id"});

  return {
    intervals,
    phrase_contains_words,
    phrase_teaches_words,
    phrases,
    user_progress,
    users,
    words,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
