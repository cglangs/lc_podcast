/* jshint indent: 2 */

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_progress', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: {
          tableName: 'users',
          schema: 'cloze_chinese'
        },
        key: 'user_id'
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
    interval_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: 'intervals',
          schema: 'cloze_chinese'
        },
        key: 'interval_id'
      }
    }
  }, {
    sequelize,
    tableName: 'user_progress',
    schema: 'cloze_chinese',
    timestamps: false,
    indexes: [
      {
        name: "up_pkey",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "word_id" },
        ]
      },
    ]
  });
};
