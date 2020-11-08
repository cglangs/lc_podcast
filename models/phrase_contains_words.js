/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('phrase_contains_words', {
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
      }
    },
    contains_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'phrase_contains_words',
    schema: 'cloze_chinese',
    timestamps: false,
    indexes: [
      {
        name: "phrase_contains_words_pkey",
        unique: true,
        fields: [
          { name: "phrase_id" },
          { name: "word_id" },
          { name: "contains_order" },
        ]
      },
    ]
  });
};
