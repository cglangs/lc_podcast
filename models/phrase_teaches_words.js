/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('phrase_teaches_words', {
    phrase_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: {
          tableName: 'phrases',
          schema: 'cloze_chinese'
        },
        key: 'phrase_id'
      }
    },
    word_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: {
          tableName: 'words',
          schema: 'cloze_chinese'
        },
        key: 'word_id'
      },
      unique: "word_iteration_key"
    },
    iteration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: "word_iteration_key"
    }
  }, {
    sequelize,
    tableName: 'phrase_teaches_words',
    schema: 'cloze_chinese',
    timestamps: false,
    indexes: [
      {
        name: "phrase_teaches_words_pkey",
        unique: true,
        fields: [
          { name: "phrase_id" },
          { name: "word_id" },
        ]
      },
      {
        name: "word_iteration_key",
        unique: true,
        fields: [
          { name: "word_id" },
          { name: "iteration" },
        ]
      },
    ]
  });
};
