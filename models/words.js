/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('words', {
    word_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    word_text: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "unique_word_text"
    },
    word_occurrences: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    pinyin: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    english: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_base_word: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'words',
    schema: 'cloze_chinese',
    timestamps: false,
    indexes: [
      {
        name: "unique_word_text",
        unique: true,
        fields: [
          { name: "word_text" },
        ]
      },
      {
        name: "words_pkey",
        unique: true,
        fields: [
          { name: "word_id" },
        ]
      },
    ]
  });
};
