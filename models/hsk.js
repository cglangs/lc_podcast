/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('hsk', {
    simplified: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    traditional: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    tones: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    pinyin: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    english: {
      type: DataTypes.STRING(1024),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'hsk',
    schema: 'cloze_chinese',
    timestamps: false
  });
};
