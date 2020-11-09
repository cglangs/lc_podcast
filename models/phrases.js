/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('phrases', {
    phrase_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    raw_text: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clean_text: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    display_text: {
      type: DataTypes.STRING(255),
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
    frequency_score: {
      type: DataTypes.REAL,
      allowNull: true
    },
    is_sentence: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    sentence_order: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'phrases',
    schema: 'cloze_chinese',
    timestamps: false,
    indexes: [
      {
        name: "phrases_pkey",
        unique: true,
        fields: [
          { name: "phrase_id" },
        ]
      },
    ]
  });
};
